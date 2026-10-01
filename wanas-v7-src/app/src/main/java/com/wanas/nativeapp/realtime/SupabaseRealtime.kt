package com.wanas.nativeapp.realtime

import okhttp3.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/** Native Supabase Realtime client with reconnect + queued broadcasts. */
class RealtimeClient(
    private val url: String,
    private val apiKey: String,
    private val accessToken: String,
    private val onEvent: (String, JSONObject) -> Unit
) {
    private val client = OkHttpClient.Builder().pingInterval(20, TimeUnit.SECONDS).build()
    private var socket: WebSocket? = null
    private val refs = AtomicInteger(0)
    private var topic: String? = null
    private var userId: String? = null
    private var presence = JSONObject()
    private var reconnectAttempt = 0
    private val queued = ArrayDeque<Pair<String, JSONObject>>()
    @Volatile private var closed = true
    @Volatile private var joined = false

    @Synchronized
    fun connect(roomTopic: String, userId: String, presence: JSONObject = JSONObject()) {
        disconnect()
        closed = false
        this.userId = userId
        this.presence = presence
        topic = if (roomTopic.startsWith("realtime:")) roomTopic else "realtime:$roomTopic"
        openSocket()
    }

    @Synchronized private fun openSocket() {
        if (closed || topic == null || userId == null) return
        joined = false
        val wsUrl = url.replaceFirst("https://", "wss://") + "/realtime/v1/websocket?apikey=$apiKey&vsn=1.0.0"
        socket = client.newWebSocket(Request.Builder().url(wsUrl).header("Authorization", "Bearer $accessToken").build(), object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                reconnectAttempt = 0
                join(topic!!, userId!!, presence)
                onEvent("realtime_state", JSONObject().put("connected", true))
            }
            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val root = JSONObject(text)
                    if (root.optString("topic") != topic) return
                    when (root.optString("event")) {
                        "phx_reply" -> {
                            val status = root.optJSONObject("payload")?.optString("status")
                            if (status == "ok") {
                                joined = true
                                onEvent("realtime_joined", JSONObject())
                                flushQueue()
                            }
                        }
                        "broadcast" -> {
                            val payload = root.optJSONObject("payload") ?: return
                            val name = payload.optString("event")
                            val body = payload.optJSONObject("payload") ?: JSONObject()
                            if (name.isNotBlank()) onEvent(name, body)
                        }
                        "presence_state", "presence_diff", "postgres_changes" -> onEvent(root.optString("event"), root.optJSONObject("payload") ?: JSONObject())
                        "phx_error", "phx_close" -> onEvent("error", root.optJSONObject("payload") ?: JSONObject())
                    }
                } catch (e: Exception) { onEvent("error", JSONObject().put("message", e.message ?: "Realtime parse error")) }
            }
            override fun onClosing(ws: WebSocket, code: Int, reason: String) {
                joined = false
                onEvent("realtime_state", JSONObject().put("connected", false))
                ws.close(code, reason)
            }
            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                joined = false
                onEvent("realtime_state", JSONObject().put("connected", false))
                if (!closed) scheduleReconnect()
            }
        })
    }

    private fun scheduleReconnect() {
        val attempt = reconnectAttempt.coerceAtMost(6)
        reconnectAttempt++
        Thread {
            try { Thread.sleep((1000L shl attempt).coerceAtMost(30000L)) } catch (_: InterruptedException) {}
            synchronized(this) { if (!closed) openSocket() }
        }.start()
    }

    private fun join(roomTopic: String, userId: String, presence: JSONObject) {
        val config = JSONObject().put("broadcast", JSONObject().put("self", false)).put("presence", JSONObject().put("key", userId)).put("postgres_changes", JSONArray())
        val payload = JSONObject().put("access_token", accessToken).put("config", config).put("user_info", presence)
        sendNow(roomTopic, "phx_join", payload)
    }

    @Synchronized fun broadcast(event: String, payload: JSONObject) {
        if (closed) return
        if (!joined) {
            if (queued.size >= 100) queued.removeFirst()
            queued.addLast(event to JSONObject(payload.toString()))
            return
        }
        topic?.let { sendNow(it, "broadcast", JSONObject().put("event", event).put("payload", payload)) }
    }

    @Synchronized private fun flushQueue() {
        val t = topic ?: return
        while (queued.isNotEmpty() && joined && !closed) {
            val (event, payload) = queued.removeFirst()
            sendNow(t, "broadcast", JSONObject().put("event", event).put("payload", payload))
        }
    }

    private fun sendNow(t: String, event: String, payload: JSONObject) {
        socket?.send(JSONObject().put("topic", t).put("event", event).put("payload", payload).put("ref", refs.incrementAndGet().toString()).put("join_ref", "1").toString())
    }

    @Synchronized fun disconnect() {
        closed = true; joined = false; queued.clear(); reconnectAttempt = 0
        socket?.close(1000, "room left"); socket = null; topic = null; userId = null
    }
}
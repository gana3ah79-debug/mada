package com.wanas.nativeapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import com.wanas.nativeapp.realtime.RealtimeClient

private const val SUPABASE_URL = "https://ffcyvxgbizenkuovznhk.supabase.co"
private const val SUPABASE_KEY = "sb_publishable_0fMfhzXO_CkRKkGLZZlzhA_KvMOmEUr"

data class Session(val accessToken: String, val userId: String, val name: String)
data class Room(val id: String, val title: String, val hostId: String, val maxSeats: Int)
data class ChatMessage(val senderName: String, val text: String, val createdAt: String)
data class MicRequest(val id: String, val userId: String, val name: String, val createdAt: String)
data class VoiceMember(val userId: String, val name: String, val approved: Boolean, val micOn: Boolean, val role: String)

class SupabaseNative(private val context: Context) {
    private val client = OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).readTimeout(20, TimeUnit.SECONDS).build()
    private val prefs = context.getSharedPreferences("wanas_native", Context.MODE_PRIVATE)
    var session: Session? = loadSession(); private set

    private fun headers(b: Request.Builder, token: String? = session?.accessToken): Request.Builder = b
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", "Bearer ${token ?: SUPABASE_KEY}")
        .header("Content-Type", "application/json")

    private suspend fun call(req: Request): String = withContext(Dispatchers.IO) {
        client.newCall(req).execute().use { r ->
            val body = r.body?.string().orEmpty()
            if (!r.isSuccessful) error("Supabase ${r.code}: ${body.take(300)}")
            body
        }
    }

    suspend fun login(email: String, password: String) {
        val body = JSONObject().put("email", email).put("password", password).toString().toRequestBody("application/json".toMediaType())
        val req = headers(Request.Builder().url("$SUPABASE_URL/auth/v1/token?grant_type=password").post(body), null).build()
        val o = JSONObject(call(req)); val token = o.getString("access_token"); val u = o.getJSONObject("user")
        val name = u.optJSONObject("user_metadata")?.optString("name").takeUnless { it.isNullOrBlank() } ?: email.substringBefore('@')
        session = Session(token, u.getString("id"), name)
        prefs.edit().putString("token", token).putString("uid", u.getString("id")).putString("name", name).apply()
    }
    fun logout() { session = null; prefs.edit().clear().apply() }
    private fun loadSession(): Session? {
        val t = prefs.getString("token", null) ?: return null
        val id = prefs.getString("uid", null) ?: return null
        return Session(t, id, prefs.getString("name", "ونيس") ?: "ونيس")
    }

    suspend fun rooms(): List<Room> {
        val req = headers(Request.Builder().url("$SUPABASE_URL/rest/v1/wanas_rooms?select=id,title,host_id,is_active,max_seats&is_active=eq.true&order=created_at.desc").get()).build()
        val a = JSONArray(call(req))
        return buildList {
            for (i in 0 until a.length()) {
                val o = a.getJSONObject(i)
                add(Room(o.getString("id"), o.optString("title", "غرفة"), o.optString("host_id"), o.optInt("max_seats", 8).coerceIn(1, 8)))
            }
        }
    }

    suspend fun enterRoom(room: Room): String = rpc("wanas_enter_room", JSONObject().put("p_room_id", room.id).put("p_password", "").put("p_stealth", false))
    suspend fun presenceJoin(roomId: String) { rpc("wanas_room_presence_join", JSONObject().put("p_room_id", roomId).put("p_name", session?.name ?: "ونيس").put("p_avatar", "👤")) }
    suspend fun presenceLeave(roomId: String) { rpc("wanas_room_presence_leave", JSONObject().put("p_room_id", roomId)) }
    suspend fun onlineCount(roomId: String): Int = JSONObject(rpc("wanas_room_presence_snapshot", JSONObject().put("p_room_id", roomId))).optInt("online_count", 0)
    suspend fun requestMic(roomId: String): String = rpc("wanas_request_room_mic", JSONObject().put("p_room_id", roomId))
    suspend fun micQueue(roomId: String): List<MicRequest> {
        val a = JSONArray(rpc("wanas_room_mic_queue_public_v2", JSONObject().put("p_room_id", roomId)))
        return buildList {
            for (i in 0 until a.length()) {
                val o = a.getJSONObject(i)
                add(MicRequest(o.optString("id"), o.optString("user_id"), o.optString("name", "عضو"), o.optString("created_at")))
            }
        }
    }
    suspend fun reviewMic(requestId: String, decision: String): JSONObject =
        JSONObject(rpc("wanas_review_room_mic", JSONObject().put("p_request_id", requestId).put("p_decision", decision).put("p_seat_no", JSONObject.NULL)))

    suspend fun sendChat(roomId: String, text: String) {
        val o = JSONObject().put("room_id", roomId).put("sender_id", session!!.userId).put("sender_name", session!!.name).put("text", text)
        val req = headers(
            Request.Builder().url("$SUPABASE_URL/rest/v1/wanas_room_messages")
                .post(o.toString().toRequestBody("application/json".toMediaType()))
                .header("Prefer", "return=minimal")
        ).build()
        call(req)
    }

    suspend fun chat(roomId: String): List<ChatMessage> {
        val req = headers(
            Request.Builder()
                .url("$SUPABASE_URL/rest/v1/wanas_room_messages?select=sender_name,text,created_at&room_id=eq.$roomId&order=created_at.asc&limit=100")
                .get()
        ).build()
        val a = JSONArray(call(req))
        return buildList {
            for (i in 0 until a.length()) {
                val o = a.getJSONObject(i)
                add(ChatMessage(o.optString("sender_name", "عضو"), o.optString("text"), o.optString("created_at")))
            }
        }
    }

    suspend fun controls(roomId: String): JSONObject = JSONObject(rpc("wanas_get_room_controls", JSONObject().put("p_room_id", roomId)))
    suspend fun setControls(roomId: String, locked: Boolean, reactions: Boolean) {
        rpc("wanas_update_room_controls", JSONObject().put("p_room_id", roomId).put("p_chat_locked", locked).put("p_slow_mode_until", JSONObject.NULL).put("p_reactions_enabled", reactions))
    }
    suspend fun clearChat(roomId: String) { rpc("wanas_clear_room_chat", JSONObject().put("p_room_id", roomId)) }
    suspend fun closeRoom(roomId: String) { rpc("wanas_close_room", JSONObject().put("p_room_id", roomId)) }
    private suspend fun rpc(name: String, args: JSONObject): String {
        val req = headers(Request.Builder().url("$SUPABASE_URL/rest/v1/rpc/$name").post(args.toString().toRequestBody("application/json".toMediaType()))).build()
        return call(req)
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        setContent { WanasApp() }
    }
}

@Composable
fun WanasApp() {
    val context = LocalContext.current
    val api = remember { SupabaseNative(context) }
    var session by remember { mutableStateOf(api.session) }
    var selected by remember { mutableStateOf<Room?>(null) }
    MaterialTheme {
        when {
            session == null -> LoginScreen(api) { session = api.session }
            selected != null -> NativeRoom(api, selected!!) { selected = null }
            else -> RoomList(api, { selected = it }) { api.logout(); session = null }
        }
    }
}

@Composable
fun LoginScreen(api: SupabaseNative, onDone: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var pass by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Scaffold(topBar = { TopAppBar(title = { Text("وَنَس — تسجيل الدخول") }) }) { p ->
        Column(Modifier.padding(p).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Native Android", style = MaterialTheme.typography.headlineSmall)
            OutlinedTextField(email, { email = it }, label = { Text("البريد الإلكتروني") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(pass, { pass = it }, label = { Text("كلمة المرور") }, modifier = Modifier.fillMaxWidth())
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(
                enabled = !busy && email.isNotBlank() && pass.isNotBlank(),
                onClick = {
                    busy = true; error = null
                    scope.launch {
                        try { api.login(email.trim(), pass); onDone() }
                        catch (e: Exception) { error = e.message }
                        finally { busy = false }
                    }
                }
            ) { Text(if (busy) "جاري الدخول…" else "دخول") }
        }
    }
}

@Composable
fun RoomList(api: SupabaseNative, onRoom: (Room) -> Unit, onLogout: () -> Unit) {
    var rooms by remember { mutableStateOf<List<Room>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    suspend fun load() {
        loading = true
        try { rooms = api.rooms(); error = null }
        catch (e: Exception) { error = e.message }
        finally { loading = false }
    }

    LaunchedEffect(Unit) { load() }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("وَنَس — الغرف") }, actions = { TextButton(onClick = onLogout) { Text("خروج") } })
        }
    ) { p ->
        Column(Modifier.padding(p).padding(16.dp)) {
            Text("غرف مباشرة", style = MaterialTheme.typography.headlineSmall)
            Button(onClick = { scope.launch { load() } }) { Text("تحديث") }
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(rooms) { r ->
                    ElevatedCard(
                        onClick = {
                            scope.launch {
                                try { api.enterRoom(r); onRoom(r) }
                                catch (e: Exception) { error = e.message }
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(r.title, style = MaterialTheme.typography.titleLarge)
                            Text("${r.maxSeats} مقاعد")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NativeRoom(api: SupabaseNative, room: Room, onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var online by remember { mutableStateOf(0) }
    var micApproved by remember { mutableStateOf(false) }
    var micOn by remember { mutableStateOf(false) }
    var locked by remember { mutableStateOf(false) }
    var reactions by remember { mutableStateOf(true) }
    var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    var requests by remember { mutableStateOf<List<MicRequest>>(emptyList()) }
    var voiceMembers by remember { mutableStateOf<Map<String, VoiceMember>>(emptyMap()) }
    var realtimeConnected by remember { mutableStateOf(false) }
    var input by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var voiceStatus by remember { mutableStateOf("الصوت متوقف") }
    val me = api.session ?: return
    val manager = me.userId == room.hostId
    var realtime by remember { mutableStateOf<RealtimeClient?>(null) }
    var voice by remember { mutableStateOf<VoiceEngine?>(null) }
    var heartbeatJob by remember { mutableStateOf<Job?>(null) }

    fun ensureVoice() {
        if (voice == null) {
            val rt = realtime ?: return
            voice = VoiceEngine(context, me.userId, rt) { message -> scope.launch { error = message } }
            voice!!.start()
        }
        voice!!.setMic(micApproved && micOn)
        voiceStatus = if (micApproved && micOn) "🎙️ المايك يعمل"
            else if (micApproved) "🔇 المايك متوقف"
            else "🔊 الاستماع للصوت متاح"
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            micOn = true
            ensureVoice()
            voice?.setMic(micApproved && micOn)
            realtime?.broadcast("voice_state", JSONObject().put("user_id", me.userId).put("name", me.name).put("approved", micApproved).put("mic_on", micOn).put("role", if (manager) "host" else "member"))
        } else {
            error = "اسمح للتطبيق باستخدام الميكروفون حتى يعمل صوت الغرفة."
        }
    }

    fun toggleMic() {
        if (!micApproved) { error = "اطلب المايك أولًا ثم انتظر قبول صاحب الغرفة."; return }
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO); return
        }
        micOn = !micOn
        ensureVoice()
        voice?.setMic(micApproved && micOn)
        realtime?.broadcast("voice_state", JSONObject().put("user_id", me.userId).put("name", me.name).put("approved", micApproved).put("mic_on", micOn).put("role", if (manager) "host" else "member"))
    }

    LaunchedEffect(room.id) {
        try {
            api.presenceJoin(room.id)
            online = api.onlineCount(room.id)
            messages = api.chat(room.id)
            val c = api.controls(room.id)
            locked = c.optBoolean("chat_locked", false)
            reactions = c.optBoolean("reactions_enabled", true)
            micApproved = manager

            lateinit var rt: RealtimeClient
            rt = RealtimeClient(SUPABASE_URL, SUPABASE_KEY, me.accessToken) { event, payload ->
                when (event) {
                    "chat" -> if (!locked) scope.launch { messages = api.chat(room.id) }
                    "room_chat_control" -> scope.launch { locked = payload.optBoolean("locked", false) }
                    "room_reactions_control" -> scope.launch { reactions = payload.optBoolean("enabled", true) }
                    "mic_review" -> if (payload.optString("user_id") == me.userId) scope.launch {
                        micApproved = payload.optString("status") == "approved"
                        if (micApproved) {
                            error = "تم قبول طلب المايك 🎙️"
                            if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                                micOn = true
                                ensureVoice()
                                voice?.setMic(true)
                                rt.broadcast("voice_state", JSONObject().put("user_id", me.userId).put("name", me.name).put("approved", true).put("mic_on", true).put("role", if (manager) "host" else "member"))
                            } else {
                                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                            }
                        }
                    }
                    "signal" -> {
                        ensureVoice()
                        voice?.onSignal(payload)
                    }
                    "realtime_state" -> {
                        realtimeConnected = payload.optBoolean("connected", false)
                        if (!realtimeConnected) voiceStatus = "⚠️ إعادة الاتصال بالصوت…"
                    }
                    "realtime_joined" -> {
                        realtimeConnected = true
                        rt.broadcast("voice_hello", JSONObject().put("from", me.userId))
                    }
                    "voice_hello" -> {
                        rt.broadcast(
                            "voice_state",
                            JSONObject()
                                .put("user_id", me.userId)
                                .put("approved", micApproved || manager)
                                .put("mic_on", voice?.isMicOn() == true)
                                .put("role", if (manager) "host" else "member")
                                .put("name", me.name)
                        )
                    }
                    "voice_state" -> {
                        val uid = payload.optString("user_id")
                        val approved = payload.optBoolean("approved", false)
                        if (uid.isNotBlank() && uid != me.userId) {
                            val member = VoiceMember(uid, payload.optString("name", "عضو"), approved, payload.optBoolean("mic_on", false), payload.optString("role", "member"))
                            voiceMembers = voiceMembers + (uid to member)
                            if (approved) {
                                ensureVoice()
                                voice?.connectTo(uid, me.userId < uid)
                                voice?.setRemoteEnabled(uid, member.micOn)
                            } else {
                                voice?.removePeer(uid)
                            }
                        }
                    }
                    "room_control" -> {
                        val action = payload.optString("action")
                        val target = payload.optString("user_id")
                        if (action == "mute_all" || (action == "force_mute" && target == me.userId)) {
                            micOn = false
                            voice?.setMic(false)
                            voiceStatus = "🔇 تم كتم المايك بواسطة الإدارة"
                            rt.broadcast("voice_state", JSONObject().put("user_id", me.userId).put("name", me.name).put("approved", micApproved).put("mic_on", false).put("role", if (manager) "host" else "member"))
                        }
                        if (action == "remove_voice" && target == me.userId) {
                            micOn = false
                            voice?.setMic(false)
                            voiceStatus = "🔇 تم إيقاف صوتك بواسطة صاحب الغرفة"
                            rt.broadcast("voice_state", JSONObject().put("user_id", me.userId).put("name", me.name).put("approved", false).put("mic_on", false).put("role", "member"))
                        }
                    }
                }
            }

            realtime = rt
            rt.connect(
                "room-voice:${room.id}",
                me.userId,
                JSONObject()
                    .put("name", me.name)
                    .put("approved", micApproved || manager)
                    .put("mic_on", false)
                    .put("role", if (manager) "host" else "member")
            )
            ensureVoice()

            heartbeatJob?.cancel()
            heartbeatJob = scope.launch {
                while (isActive) {
                    delay(2500)
                    rt.broadcast("voice_hello", JSONObject().put("from", me.userId))
                    online = try { api.onlineCount(room.id) } catch (_: Exception) { online }
                    if (manager) requests = try { api.micQueue(room.id) } catch (_: Exception) { requests }
                }
            }
        } catch (e: Exception) {
            error = e.message
        }
    }

    DisposableEffect(room.id) {
        onDispose {
            heartbeatJob?.cancel()
            try { realtime?.disconnect() } catch (_: Throwable) {}
            try { voice?.stop() } catch (_: Throwable) {}
            scope.launch { try { api.presenceLeave(room.id) } catch (_: Throwable) {} }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(room.title) },
                navigationIcon = { TextButton(onClick = onBack) { Text("رجوع") } }
            )
        }
    ) { p ->
        Column(Modifier.padding(p).padding(14.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            Text("غرفة Native — صوت WebRTC", style = MaterialTheme.typography.titleLarge)
            Text("متصل الآن: ${online} / ${room.maxSeats}")
            Text(voiceStatus, style = MaterialTheme.typography.bodySmall)
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                repeat(room.maxSeats) { AssistChip(onClick = {}, label = { Text("مقعد ${it + 1}") }) }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = {
                    if (!micApproved) {
                        scope.launch {
                            try {
                                val x = JSONObject(api.requestMic(room.id))
                                micApproved = x.optString("status") == "approved"
                                if (micApproved) {
                                    micOn = true
                                    ensureVoice()
                                    voice?.setMic(true)
                                    realtime?.broadcast("voice_state", JSONObject().put("user_id", me.userId).put("name", me.name).put("approved", true).put("mic_on", true).put("role", if (manager) "host" else "member"))
                                    error = "تم فتح المايك لك 🎙️"
                                } else {
                                    error = "تم إرسال طلب المايك للمضيف."
                                }
                            } catch (e: Exception) { error = e.message }
                        }
                    } else {
                        toggleMic()
                    }
                }) { Text(if (!micApproved) "🙋 طلب المايك" else if (micOn) "🔇 إيقاف المايك" else "🎙️ تشغيل المايك") }

                if (micApproved && !micOn) {
                    OutlinedButton(onClick = { toggleMic() }) { Text("تشغيل الصوت") }
                }
            }

            if (manager) {
                Text("طلبات المايك", style = MaterialTheme.typography.titleMedium)
                if (requests.isEmpty()) Text("لا توجد طلبات حالياً", style = MaterialTheme.typography.bodySmall)
                requests.forEach { r ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("✋ ${r.name}")
                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            TextButton(onClick = {
                                scope.launch {
                                    try {
                                        val q = api.reviewMic(r.id, "approved")
                                        realtime?.broadcast("mic_review", JSONObject().put("user_id", q.optString("user_id", r.userId)).put("status", "approved"))
                                        requests = api.micQueue(room.id)
                                    } catch (e: Exception) { error = e.message }
                                }
                            }) { Text("قبول") }
                            TextButton(onClick = {
                                scope.launch {
                                    try {
                                        val q = api.reviewMic(r.id, "rejected")
                                        realtime?.broadcast("mic_review", JSONObject().put("user_id", q.optString("user_id", r.userId)).put("status", "rejected"))
                                        requests = api.micQueue(room.id)
                                    } catch (e: Exception) { error = e.message }
                                }
                            }) { Text("رفض") }
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    Button(onClick = {
                        scope.launch {
                            try {
                                locked = !locked
                                api.setControls(room.id, locked, reactions)
                                realtime?.broadcast("room_chat_control", JSONObject().put("locked", locked))
                            } catch (e: Exception) { error = e.message }
                        }
                    }) { Text(if (locked) "فتح الشات" else "قفل الشات") }

                    Button(onClick = {
                        scope.launch {
                            try {
                                reactions = !reactions
                                api.setControls(room.id, locked, reactions)
                                realtime?.broadcast("room_reactions_control", JSONObject().put("enabled", reactions))
                            } catch (e: Exception) { error = e.message }
                        }
                    }) { Text(if (reactions) "إيقاف التفاعلات" else "تشغيل التفاعلات") }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    Button(onClick = {
                        realtime?.broadcast("room_control", JSONObject().put("action", "mute_all"))
                        micOn = false
                        voice?.setMic(false)
                        voiceStatus = "🔇 تم كتم كل المايكات"
                    }) { Text("🔇 كتم الكل") }

                    Button(onClick = {
                        scope.launch {
                            try {
                                api.clearChat(room.id)
                                messages = emptyList()
                                realtime?.broadcast("room_chat_control", JSONObject().put("clear", true))
                            } catch (e: Exception) { error = e.message }
                        }
                    }) { Text("🧹 تنظيف الشات") }

                    Button(onClick = {
                        scope.launch {
                            try { api.closeRoom(room.id); onBack() }
                            catch (e: Exception) { error = e.message }
                        }
                    }) { Text("🔒 إغلاق") }
                }
            }

            Text("الأعضاء والصوت", style = MaterialTheme.typography.titleMedium)
            Text(
                if (realtimeConnected) "🟢 Realtime متصل" else "🟠 جاري الاتصال…",
                style = MaterialTheme.typography.bodySmall
            )

            if (voiceMembers.isEmpty()) {
                Text("لا يوجد أعضاء صوت ظاهرون حتى الآن", style = MaterialTheme.typography.bodySmall)
            } else {
                voiceMembers.values.sortedBy { it.name }.forEach { member ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${if (member.micOn) "🎙️" else "🔇"} ${member.name}")
                        if (manager) {
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                TextButton(onClick = {
                                    realtime?.broadcast("room_control", JSONObject().put("action", "force_mute").put("user_id", member.userId))
                                    voice?.setRemoteEnabled(member.userId, false)
                                    voiceMembers = voiceMembers + (member.userId to member.copy(micOn = false))
                                }) { Text("كتم") }

                                TextButton(onClick = {
                                    realtime?.broadcast("room_control", JSONObject().put("action", "remove_voice").put("user_id", member.userId))
                                    voice?.removePeer(member.userId)
                                }) { Text("إزالة الصوت") }
                            }
                        }
                    }
                }
            }

            Text("الشات", style = MaterialTheme.typography.titleMedium)
            LazyColumn(
                Modifier.weight(1f, false).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                items(messages) { m -> Text("${m.senderName}: ${m.text}") }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                OutlinedTextField(
                    input,
                    { input = it },
                    label = { Text(if (locked && !manager) "الشات مغلق" else "رسالة") },
                    enabled = !locked || manager,
                    modifier = Modifier.weight(1f)
                )
                Button(
                    enabled = input.isNotBlank() && (!locked || manager),
                    onClick = {
                        val t = input.trim()
                        input = ""
                        scope.launch {
                            try {
                                api.sendChat(room.id, t)
                                messages = api.chat(room.id)
                                realtime?.broadcast("chat", JSONObject().put("sender_id", me.userId))
                            } catch (e: Exception) { error = e.message }
                        }
                    }
                ) { Text("إرسال") }
            }
        }
    }
}

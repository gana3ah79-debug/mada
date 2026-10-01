package com.wanas.nativeapp

import android.content.Context
import android.media.AudioManager
import com.wanas.nativeapp.realtime.RealtimeClient
import org.json.JSONObject
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.RtpTransceiver
import org.webrtc.SessionDescription
import org.webrtc.audio.JavaAudioDeviceModule
import java.util.concurrent.ConcurrentHashMap

/** Native WebRTC mesh. REST decides who may speak; Realtime carries SDP/ICE. */
class VoiceEngine(
    private val context: Context,
    private val userId: String,
    private val signaling: RealtimeClient,
    private val onError: (String) -> Unit
) {
    private val peers = ConcurrentHashMap<String, PeerConnection>()
    private val pendingIce = ConcurrentHashMap<String, MutableList<IceCandidate>>()
    private var factory: PeerConnectionFactory? = null
    private var localAudio: AudioTrack? = null
    private var localSource: AudioSource? = null
    private var audioDevice: JavaAudioDeviceModule? = null
    private var running = false
    private var micOn = false

    init {
        ensureWebRtcInitialized(context.applicationContext)
        audioDevice = JavaAudioDeviceModule.builder(context.applicationContext).createAudioDeviceModule()
        factory = PeerConnectionFactory.builder().setAudioDeviceModule(audioDevice).createPeerConnectionFactory()
        (context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager)?.apply {
            mode = AudioManager.MODE_IN_COMMUNICATION
            isSpeakerphoneOn = true
        }
    }

    fun start() {
        if (running) return
        running = true
        if (localAudio == null) {
            val constraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
            }
            localSource = factory?.createAudioSource(constraints)
            localAudio = factory?.createAudioTrack("wanas-audio-$userId", localSource).also { it?.setEnabled(false) }
        }
    }

    fun setMic(enabled: Boolean) {
        micOn = enabled
        localAudio?.setEnabled(enabled)
    }

    fun setRemoteEnabled(remoteId: String, enabled: Boolean) {
        peers[remoteId]?.receivers?.forEach { receiver ->
            receiver.track()?.setEnabled(enabled)
        }
    }
    fun isMicOn(): Boolean = micOn
    fun onSignal(payload: JSONObject) { handleSignal(payload) }

    fun connectTo(remoteId: String, makeOffer: Boolean) {
        if (!running || remoteId == userId || peers.containsKey(remoteId)) return
        val pc = newPeer(remoteId)
        if (makeOffer) pc.createOffer(object : SdpObserverBase() {
            override fun onCreateSuccess(desc: SessionDescription) {
                pc.setLocalDescription(SdpObserverBase(), desc)
                signaling.broadcast("signal", JSONObject().put("to", remoteId).put("from", userId).put("kind", "offer")
                    .put("offer", JSONObject().put("type", desc.type.canonicalForm()).put("sdp", desc.description)))
            }
            override fun onCreateFailure(error: String) { onError("تعذر إنشاء اتصال الصوت: $error") }
        }, MediaConstraints())
    }

    private fun newPeer(remoteId: String): PeerConnection {
        val rtc = PeerConnection.RTCConfiguration(listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer()
        ))
        val pc = factory!!.createPeerConnection(rtc, object : PeerConnection.Observer {
            override fun onIceCandidate(c: IceCandidate) {
                signaling.broadcast("signal", JSONObject().put("to", remoteId).put("from", userId).put("kind", "ice")
                    .put("candidate", JSONObject().put("sdpMid", c.sdpMid).put("sdpMLineIndex", c.sdpMLineIndex).put("candidate", c.sdp)))
            }
            override fun onTrack(t: RtpTransceiver?) { t?.receiver?.track()?.setEnabled(true) }
            override fun onAddTrack(r: RtpReceiver?, streams: Array<out org.webrtc.MediaStream>?) { r?.track()?.setEnabled(true) }
            override fun onIceConnectionChange(s: PeerConnection.IceConnectionState) { if (s == PeerConnection.IceConnectionState.FAILED) onError("اتصال صوت أحد الأعضاء فشل؛ سيُعاد عند تحديث الغرفة.") }
            override fun onSignalingChange(s: PeerConnection.SignalingState?) {}
            override fun onIceConnectionReceivingChange(r: Boolean) {}
            override fun onIceGatheringChange(s: PeerConnection.IceGatheringState?) {}
            override fun onIceCandidatesRemoved(c: Array<out IceCandidate>?) {}
            override fun onConnectionChange(s: PeerConnection.PeerConnectionState?) {
                if (s == PeerConnection.PeerConnectionState.FAILED || s == PeerConnection.PeerConnectionState.CLOSED) {
                    removePeer(remoteId)
                }
            }
            override fun onDataChannel(d: org.webrtc.DataChannel?) {}
            override fun onRenegotiationNeeded() {}
            override fun onRemoveStream(s: org.webrtc.MediaStream?) {}
            override fun onAddStream(s: org.webrtc.MediaStream?) {}
        }) ?: error("تعذر إنشاء اتصال الصوت")
        localAudio?.let { pc.addTrack(it) }
        peers[remoteId] = pc
        return pc
    }

    private fun handleSignal(p: JSONObject) {
        if (p.optString("to") != userId) return
        val from = p.optString("from"); if (from.isBlank()) return
        val pc = peers[from] ?: newPeer(from)
        when (p.optString("kind")) {
            "offer" -> {
                val o = p.optJSONObject("offer") ?: return
                val desc = SessionDescription(SessionDescription.Type.fromCanonicalForm(o.optString("type")), o.optString("sdp"))
                pc.setRemoteDescription(object : SdpObserverBase() {
                    override fun onSetSuccess() {
                        flushIce(from, pc)
                        pc.createAnswer(object : SdpObserverBase() {
                            override fun onCreateSuccess(a: SessionDescription) {
                                pc.setLocalDescription(SdpObserverBase(), a)
                                signaling.broadcast("signal", JSONObject().put("to", from).put("from", userId).put("kind", "answer")
                                    .put("answer", JSONObject().put("type", a.type.canonicalForm()).put("sdp", a.description)))
                            }
                            override fun onCreateFailure(error: String) { onError("تعذر إنشاء إجابة الصوت: $error") }
                        }, MediaConstraints())
                    }
                    override fun onSetFailure(error: String) { onError("تعذر ضبط وصف الصوت: $error") }
                }, desc)
            }
            "answer" -> {
                val a = p.optJSONObject("answer") ?: return
                pc.setRemoteDescription(object : SdpObserverBase() {
                    override fun onSetSuccess() { flushIce(from, pc) }
                    override fun onSetFailure(error: String) { onError("تعذر ضبط إجابة الصوت: $error") }
                }, SessionDescription(SessionDescription.Type.fromCanonicalForm(a.optString("type")), a.optString("sdp")))
            }
            "ice" -> {
                val c = p.optJSONObject("candidate") ?: return
                val ice = IceCandidate(c.optString("sdpMid"), c.optInt("sdpMLineIndex"), c.optString("candidate"))
                pendingIce.getOrPut(from) { mutableListOf() }.add(ice)
                if (pc.remoteDescription != null) flushIce(from, pc)
            }
        }
    }

    private fun flushIce(id: String, pc: PeerConnection) {
        pendingIce.remove(id)?.forEach { try { pc.addIceCandidate(it) } catch (_: Throwable) {} }
    }
    fun removePeer(id: String) {
        pendingIce.remove(id)
        try { peers.remove(id)?.close() } catch (_: Throwable) {}
    }
    fun stop() {
        peers.values.forEach { try { it.close() } catch (_: Throwable) {} }; peers.clear(); pendingIce.clear()
        setMic(false); running = false
        try { localSource?.dispose() } catch (_: Throwable) {}; localSource = null; localAudio = null
        try { audioDevice?.release() } catch (_: Throwable) {}; audioDevice = null
        try { factory?.dispose() } catch (_: Throwable) {}; factory = null
        try {
            (context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager)?.apply {
                mode = AudioManager.MODE_NORMAL
                isSpeakerphoneOn = false
            }
        } catch (_: Throwable) {}
    }
}

open class SdpObserverBase : org.webrtc.SdpObserver {
    override fun onCreateSuccess(desc: SessionDescription) {}
    override fun onSetSuccess() {}
    override fun onCreateFailure(error: String) {}
    override fun onSetFailure(error: String) {}
}

private object WebRtcRuntime {
    @Volatile var initialized: Boolean = false
}

private fun ensureWebRtcInitialized(context: Context) {
    if (WebRtcRuntime.initialized) return
    synchronized(WebRtcRuntime) {
        if (WebRtcRuntime.initialized) return
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(context).createInitializationOptions()
        )
        WebRtcRuntime.initialized = true
    }
}

package com.mada.app;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.webkit.*;

public class MainActivity extends Activity {
    private static final String URL = "https://mada-3g8.pages.dev";
    private static final int FILE_REQUEST = 1001;
    WebView web;
    ValueCallback<Uri[]> fileCallback;
    SharedPreferences sp;
    String pendingSender;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        sp = getSharedPreferences("mada", 0);
        pendingSender = b != null ? b.getString("pending_sender", null) : null;
        Intent in = getIntent();
        if (in != null && in.hasExtra("sender_id")) pendingSender = in.getStringExtra("sender_id");

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new Bridge(), "MadaNative");
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView v, String u) {
                syncSession();
                openPendingChat();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    startActivityForResult(p.createIntent(), FILE_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
            }
        });
        setContentView(web);
        web.loadUrl(URL + "?apk=2.1");
    }

    @Override protected void onNewIntent(Intent in) {
        super.onNewIntent(in);
        setIntent(in);
        if (in != null && in.hasExtra("sender_id")) {
            pendingSender = in.getStringExtra("sender_id");
            openPendingChat();
        }
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        out.putString("pending_sender", pendingSender);
        super.onSaveInstanceState(out);
    }

    @Override protected void onResume() {
        super.onResume();
        startBuzzServiceFromSavedSession();
        if (web != null) web.postDelayed(this::syncSession, 1000);
    }

    void startBuzzServiceFromSavedSession() {
        String access = sp.getString("access", "");
        String uid = sp.getString("uid", "");
        if (access.isEmpty() || uid.isEmpty()) return;
        startBuzzService();
    }

    void syncSession() {
        String js = "(async()=>{try{" +
                "let s=window.MADA_SUPABASE_CLIENT;" +
                "if(!s)return null;" +
                "let r=await s.auth.getSession();" +
                "let x=r.data&&r.data.session;" +
                "return x?JSON.stringify({access_token:x.access_token,refresh_token:x.refresh_token,user_id:x.user.id}):null" +
                "}catch(e){return null}})()";
        web.evaluateJavascript(js, v -> {
            try {
                if (v == null || "null".equals(v)) return;
                Object raw = new org.json.JSONTokener(v).nextValue();
                if (!(raw instanceof String)) return;
                org.json.JSONObject o = new org.json.JSONObject((String) raw);
                sp.edit()
                        .putString("access", o.getString("access_token"))
                        .putString("refresh", o.optString("refresh_token"))
                        .putString("uid", o.getString("user_id"))
                        .apply();
                startBuzzService();
            } catch (Exception ignored) {}
        });
    }

    void openPendingChat() {
        if (pendingSender == null || pendingSender.isEmpty() || web == null) return;
        String id = org.json.JSONObject.quote(pendingSender);
        String js = "(()=>{try{" +
                "if(window.MadaMessenger&&window.MadaMessenger.openFriend){" +
                "window.MadaMessenger.openFriend(" + id + ");return true}" +
                "return false" +
                "}catch(e){return false}})()";
        web.postDelayed(() -> web.evaluateJavascript(js, v -> {
            if (v != null && v.contains("true")) pendingSender = null;
        }), 700);
    }

    void startBuzzService() {
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) {
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName())));
            } catch (Exception ignored) {}
            return;
        }
        Intent i = new Intent(this, BuzzService.class);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i);
        else startService(i);
    }

    class Bridge {
        @JavascriptInterface public void startOverlay() { startBuzzService(); }
    }

    @Override public void onActivityResult(int r, int c, Intent d) {
        super.onActivityResult(r, c, d);
        if (r == FILE_REQUEST && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(c, d));
            fileCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}

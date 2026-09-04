package com.mada.app;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  private WebView web;
  private ValueCallback<Uri[]> fileCallback;
  private static final int FILE_CHOOSER_REQUEST = 1001;
  private static final int NOTIFICATION_REQUEST = 2001;
  private static final String CHANNEL_ID = "mada_messages";
  private static final String SUPABASE_ASSET = "mada/supabase.min.js";

  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    web = new WebView(this);
    setContentView(web);

    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setBuiltInZoomControls(false);
    s.setDisplayZoomControls(false);
    s.setDatabaseEnabled(true);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);

    CookieManager cookies = CookieManager.getInstance();
    cookies.setAcceptCookie(true);
    if (Build.VERSION.SDK_INT >= 21) cookies.setAcceptThirdPartyCookies(web, true);

    web.addJavascriptInterface(new MadaNativeBridge(), "MadaNative");
    web.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        String url = request == null || request.getUrl() == null ? "" : request.getUrl().toString();
        // The web app normally requests Supabase from jsDelivr. Inside the APK we
        // replace that network request with the exact SDK bundled in the APK.
        if (url.contains("@supabase/supabase-js@") && url.contains("/dist/umd/")) {
          try {
            return new WebResourceResponse("application/javascript", "UTF-8", getAssets().open(SUPABASE_ASSET));
          } catch (Exception ignored) {
            // Fall through to the original network request if the asset is missing.
          }
        }
        return super.shouldInterceptRequest(view, request);
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = callback;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "video/*"});
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
        try { startActivityForResult(intent, FILE_CHOOSER_REQUEST); }
        catch (Exception e) { fileCallback.onReceiveValue(null); fileCallback = null; }
        return true;
      }
    });

    createNotificationChannel();
    requestNotificationPermission();
    web.loadUrl("file:///android_asset/mada/index.html");
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "رسائل Mada", NotificationManager.IMPORTANCE_HIGH);
      channel.setDescription("إشعارات الرسائل والفقاعات");
      channel.setLightColor(Color.WHITE);
      channel.setVibrationPattern(new long[]{0, 250, 100, 250});
      channel.setAllowBubbles(true);
      getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
  }

  private void requestNotificationPermission() {
    if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
      requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_REQUEST);
    }
  }

  private void showMessageBubble(String conversationId, String title, String message) {
    if (conversationId == null || conversationId.trim().isEmpty()) return;
    if (Build.VERSION.SDK_INT < 29) return;
    if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;

    Intent intent = new Intent(this, MainActivity.class);
    intent.setAction("com.mada.app.OPEN_CONVERSATION");
    intent.putExtra("conversation_id", conversationId);
    intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    PendingIntent pending = PendingIntent.getActivity(this, conversationId.hashCode(), intent,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    Notification.Builder builder = Build.VERSION.SDK_INT >= 26
        ? new Notification.Builder(this, CHANNEL_ID)
        : new Notification.Builder(this);
    builder.setSmallIcon(android.R.drawable.ic_dialog_email)
        .setContentTitle(title == null || title.isEmpty() ? "Mada" : title)
        .setContentText(message == null ? "رسالة جديدة" : message)
        .setAutoCancel(true)
        .setCategory(Notification.CATEGORY_MESSAGE)
        .setContentIntent(pending)
        .setPriority(Notification.PRIORITY_HIGH);

    if (Build.VERSION.SDK_INT >= 29) {
      Notification.BubbleMetadata bubble = new Notification.BubbleMetadata.Builder(pending, getBubbleIcon())
          .setDesiredHeight(600)
          .setAutoExpandBubble(false)
          .setSuppressNotification(false)
          .build();
      builder.setBubbleMetadata(bubble);
    }

    getSystemService(NotificationManager.class).notify(conversationId.hashCode(), builder.build());
  }

  private android.graphics.drawable.Icon getBubbleIcon() {
    if (Build.VERSION.SDK_INT >= 23) return android.graphics.drawable.Icon.createWithResource(this, android.R.drawable.ic_dialog_email);
    return null;
  }

  private void openConversationFromIntent(Intent intent) {
    if (intent == null) return;
    String id = intent.getStringExtra("conversation_id");
    if (id == null || web == null) return;
    final String safe = id.replace("\\", "\\\\").replace("'", "\\'");
    web.evaluateJavascript("window.openMadaConversation && window.openMadaConversation('" + safe + "')", null);
  }

  @Override protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    openConversationFromIntent(intent);
  }

  public class MadaNativeBridge {
    @JavascriptInterface public void showMessageBubble(String conversationId, String title, String message) {
      runOnUiThread(() -> MainActivity.this.showMessageBubble(conversationId, title, message));
    }
    @JavascriptInterface public void openNotificationSettings() {
      Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
      i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
      startActivity(i);
    }
  }

  @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode == FILE_CHOOSER_REQUEST) {
      Uri[] results = null;
      if (resultCode == RESULT_OK && data != null && data.getData() != null) results = new Uri[]{data.getData()};
      if (fileCallback != null) fileCallback.onReceiveValue(results);
      fileCallback = null;
    }
  }

  @Override public void onBackPressed() {
    if (web.canGoBack()) web.goBack(); else super.onBackPressed();
  }
}

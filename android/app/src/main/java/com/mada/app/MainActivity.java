package com.mada.app;

import android.app.*;import android.content.*;import android.net.Uri;import android.os.*;import android.provider.Settings;import android.webkit.*;import android.view.*;import android.widget.*;import java.util.*;

public class MainActivity extends Activity{
 WebView web; SharedPreferences sp;
 static final String URL="https://mada-3g8.pages.dev";
 @Override public void onCreate(Bundle b){super.onCreate(b);sp=getSharedPreferences("mada",0); web=new WebView(this); web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setMediaPlaybackRequiresUserGesture(false);web.addJavascriptInterface(new Bridge(),"MadaNative");web.setWebViewClient(new WebViewClient(){@Override public void onPageFinished(WebView v,String u){syncSession();}});setContentView(web);web.loadUrl(URL);}
 @Override protected void onResume(){super.onResume(); if(web!=null)web.postDelayed(this::syncSession,800);}
 void syncSession(){web.evaluateJavascript("(async()=>{try{let s=window.MADA_SUPABASE_CLIENT;if(!s)return null;let r=await s.auth.getSession();let x=r.data&&r.data.session;if(x)return JSON.stringify({access_token:x.access_token,refresh_token:x.refresh_token,user_id:x.user.id});}catch(e){}return null})()",v->{if(v==null||v.equals("null"))return;try{String x=android.text.TextUtils.htmlEncode(v);x=x.substring(1,x.length()-1).replace("\\\"","\"").replace("\\\\","\\");org.json.JSONObject o=new org.json.JSONObject(x);sp.edit().putString("access",o.getString("access_token")).putString("refresh",o.optString("refresh_token")).putString("uid",o.getString("user_id")).apply();startBuzzService();}catch(Exception ignored){}});}
 void startBuzzService(){if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){try{startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:"+getPackageName())));}catch(Exception ignored){} } Intent i=new Intent(this,BuzzService.class);if(Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);}
 class Bridge{ @JavascriptInterface public void startOverlay(){startBuzzService();} }
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}

package com.mada.app;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;
import android.text.TextUtils;
import okhttp3.*;
import org.json.*;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;

public class CallNotificationService extends Service {
    static final String URL="https://eclnddvupggxyythtpkv.supabase.co";
    static final String KEY="sb_publishable_FqI5heK77syr-3QHh2LPHg_E82vbq-0";
    static final String CHANNEL="mada_call_watch";
    final Handler h=new Handler(Looper.getMainLooper());
    final OkHttpClient client=new OkHttpClient.Builder().connectTimeout(12,TimeUnit.SECONDS).readTimeout(12,TimeUnit.SECONDS).writeTimeout(12,TimeUnit.SECONDS).build();
    SharedPreferences sp;
    String token="",refresh="",uid="",lastAt="";
    boolean busy=false;
    final HashSet<String> seen=new HashSet<>();
    final Runnable poll=this::poll;

    @Override public void onCreate(){
        super.onCreate();
        sp=getSharedPreferences("mada",0);
        createChannel();
        load();
        if(lastAt.isEmpty()) lastAt=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US).format(new Date(System.currentTimeMillis()-30000L));
        startForegroundCompat();
        h.post(poll);
    }

    void load(){token=sp.getString("access","");refresh=sp.getString("refresh","");uid=sp.getString("uid","");}

    void createChannel(){
        if(Build.VERSION.SDK_INT>=26){
            NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel c=new NotificationChannel(CHANNEL,"مكالمات Mada",NotificationManager.IMPORTANCE_HIGH);
            c.enableVibration(true);
            c.setVibrationPattern(new long[]{0,300,150,300,150,600});
            c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
    }

    Notification baseNotification(){
        PendingIntent pi=PendingIntent.getActivity(this,9001,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        return new Notification.Builder(this,CHANNEL)
            .setSmallIcon(android.R.drawable.sym_action_call)
            .setContentTitle("Mada")
            .setContentText("حماية المكالمات تعمل")
            .setOngoing(true)
            .setContentIntent(pi)
            .build();
    }

    void startForegroundCompat(){
        if(Build.VERSION.SDK_INT>=34) startForeground(9001,baseNotification(),ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING);
        else startForeground(9001,baseNotification());
    }

    void poll(){
        if(busy){h.postDelayed(poll,4000);return;}
        load();
        if(TextUtils.isEmpty(uid)||TextUtils.isEmpty(token)){h.postDelayed(poll,5000);return;}
        busy=true;
        Request cm=new Request.Builder()
            .url(URL+"/rest/v1/conversation_members?select=conversation_id&user_id=eq."+uid+"&limit=100")
            .addHeader("apikey",KEY).addHeader("Authorization","Bearer "+token).build();
        client.newCall(cm).enqueue(new Callback(){
            public void onFailure(Call c,java.io.IOException e){finishPoll(4000);}
            public void onResponse(Call c,Response r)throws java.io.IOException{
                try{
                    String t=r.body()!=null?r.body().string():"[]";
                    if(r.code()==401){refreshSession();finishPoll(5000);return;}
                    if(!r.isSuccessful()){finishPoll(5000);return;}
                    JSONArray mem=new JSONArray(t);
                    if(mem.length()==0){finishPoll(4000);return;}
                    StringBuilder ids=new StringBuilder();
                    for(int i=0;i<mem.length();i++){if(i>0)ids.append(",");ids.append(mem.getJSONObject(i).optString("conversation_id"));}
                    HttpUrl q=HttpUrl.parse(URL+"/rest/v1/messages").newBuilder()
                        .addQueryParameter("select","id,sender_id,created_at,message_type")
                        .addQueryParameter("message_type","eq.call_offer")
                        .addQueryParameter("conversation_id","in.("+ids+")")
                        .addQueryParameter("created_at","gt."+lastAt)
                        .addQueryParameter("order","created_at.asc")
                        .addQueryParameter("limit","20").build();
                    Request rq=new Request.Builder().url(q).addHeader("apikey",KEY).addHeader("Authorization","Bearer "+token).build();
                    client.newCall(rq).enqueue(new Callback(){
                        public void onFailure(Call c,java.io.IOException e){finishPoll(4000);}
                        public void onResponse(Call c,Response rr)throws java.io.IOException{
                            try{
                                String tt=rr.body()!=null?rr.body().string():"[]";
                                if(rr.code()==401){refreshSession();finishPoll(5000);return;}
                                if(rr.isSuccessful()){
                                    JSONArray a=new JSONArray(tt);
                                    for(int i=0;i<a.length();i++){
                                        JSONObject row=a.getJSONObject(i);
                                        String at=row.optString("created_at",lastAt), id=row.optString("id",""), sender=row.optString("sender_id","");
                                        if(!TextUtils.isEmpty(at)&&at.compareTo(lastAt)>0)lastAt=at;
                                        if(!uid.equals(sender)&&remember(id))showCall(sender,id);
                                    }
                                }
                            }catch(Exception ignored){} finally{finishPoll(4000);}
                        }
                    });
                }catch(Exception ignored){finishPoll(4000);}
            }
        });
    }

    boolean remember(String id){
        if(TextUtils.isEmpty(id))return false;
        synchronized(seen){if(seen.contains(id))return false;seen.add(id);if(seen.size()>200){Iterator<String> i=seen.iterator();if(i.hasNext()){i.next();i.remove();}}return true;}
    }

    void showCall(String sender,String messageId){
        try{
            Intent i=new Intent(this,MainActivity.class);
            i.putExtra("sender_id",sender);
            i.putExtra("call_message_id",messageId);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi=PendingIntent.getActivity(this,(int)(System.currentTimeMillis()&0x7fffffff),i,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            Notification.Builder b=new Notification.Builder(this,CHANNEL)
                .setSmallIcon(android.R.drawable.sym_action_call)
                .setContentTitle("📞 مكالمة واردة في Mada")
                .setContentText("اضغط للرد على المكالمة الصوتية")
                .setCategory(Notification.CATEGORY_CALL)
                .setPriority(Notification.PRIORITY_MAX)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setFullScreenIntent(pi,true)
                .setVibrate(new long[]{0,300,150,300,150,600});
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify((int)(System.currentTimeMillis()&0x7fffffff),b.build());
        }catch(Exception ignored){}
    }

    void finishPoll(long delay){busy=false;h.postDelayed(poll,delay);}

    void refreshSession(){
        if(TextUtils.isEmpty(refresh))return;
        try{
            String enc=java.net.URLEncoder.encode(refresh,"UTF-8");
            RequestBody body=RequestBody.create("grant_type=refresh_token&refresh_token="+enc,MediaType.parse("application/x-www-form-urlencoded"));
            Request req=new Request.Builder().url(URL+"/auth/v1/token?grant_type=refresh_token").post(body).addHeader("apikey",KEY).build();
            client.newCall(req).enqueue(new Callback(){
                public void onFailure(Call c,java.io.IOException e){}
                public void onResponse(Call c,Response r)throws java.io.IOException{
                    try{
                        String t=r.body()!=null?r.body().string():"{}"; JSONObject o=new JSONObject(t);
                        String a=o.optString("access_token",""); if(TextUtils.isEmpty(a))return;
                        String rr=o.optString("refresh_token",refresh); token=a;refresh=rr;
                        sp.edit().putString("access",a).putString("refresh",rr).apply();
                    }catch(Exception ignored){}
                }
            });
        }catch(Exception ignored){}
    }

    @Override public int onStartCommand(Intent intent,int flags,int startId){load();return START_STICKY;}
    @Override public void onDestroy(){h.removeCallbacks(poll);client.dispatcher().cancelAll();client.connectionPool().evictAll();super.onDestroy();}
    @Override public android.os.IBinder onBind(Intent intent){return null;}
}
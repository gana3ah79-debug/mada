package com.mada.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class BuzzActivity extends Activity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        String senderId = getIntent().getStringExtra("sender_id");
        String name = getIntent().getStringExtra("sender_name");
        if (name == null || name.isEmpty()) name = "صديق Mada";

        LinearLayout root = new LinearLayout(this);
        root.setGravity(Gravity.CENTER);
        root.setPadding(28, 28, 28, 28);
        root.setBackgroundColor(0x66000000);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);
        card.setPadding(30, 28, 30, 28);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setStroke(6, Color.rgb(245,158,11));
        bg.setCornerRadius(30);
        card.setBackground(bg);
        card.setElevation(24f);

        TextView title = new TextView(this);
        title.setText(name + "\n\nأرسل لك Buzz 📳");
        title.setTextColor(Color.rgb(20,35,60));
        title.setTextSize(24);
        title.setGravity(Gravity.CENTER);
        title.setTypeface(null, 1);
        card.addView(title, new LinearLayout.LayoutParams(-1, -2));

        TextView body = new TextView(this);
        body.setText("📳\n\nهـــزّك صديقك في Mada!");
        body.setTextColor(Color.rgb(55,65,81));
        body.setTextSize(21);
        body.setGravity(Gravity.CENTER);
        body.setPadding(0, 26, 0, 26);
        card.addView(body, new LinearLayout.LayoutParams(-1, -2));

        Button open = new Button(this);
        open.setText("فتح المحادثة");
        open.setTextSize(18);
        open.setTextColor(Color.WHITE);
        GradientDrawable ob = new GradientDrawable();
        ob.setColor(Color.rgb(245,158,11));
        ob.setCornerRadius(22);
        open.setBackground(ob);
        final String sid = senderId;
        open.setOnClickListener(v -> {
            Intent i = new Intent(this, MainActivity.class);
            if (sid != null) i.putExtra("sender_id", sid);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(i);
            finish();
        });
        card.addView(open, new LinearLayout.LayoutParams(-1, 82));
        root.addView(card, new LinearLayout.LayoutParams(-1, -2));
        setContentView(root);
        handler.postDelayed(this::finish, 12000);
    }
    @Override protected void onDestroy() { handler.removeCallbacksAndMessages(null); super.onDestroy(); }
}

package com.fitgo.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Optimasi WebView untuk aplikasi map-heavy
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            
            // Hardware Acceleration & Rendering Priority
            // Note: setRenderPriority is deprecated but still works for older versions
            // and hardware acceleration is usually on by default but explicitly setting it doesn't hurt.
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        }
    }
}

package today.adh.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure WebView for optimal performance and security
        this.bridge.getWebView().post(() -> {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // ===== CACHING CONFIGURATION =====
            // Enable caching for better offline experience
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            // Note: setAppCacheEnabled() and setAppCachePath() are deprecated and removed
            // in newer Android versions

            // ===== PERFORMANCE OPTIMIZATION =====
            // Enable hardware acceleration for smooth scrolling
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

            // Enable JavaScript (required for Capacitor)
            settings.setJavaScriptEnabled(true);

            // ===== SECURITY CONFIGURATION =====
            // Disable file access for security (Play Store requirement)
            settings.setAllowFileAccess(false);
            settings.setAllowContentAccess(false);

            // Enable safe browsing
            // Enable safe browsing (API 26+)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                settings.setSafeBrowsingEnabled(true);
            }

            // Mixed content mode - block all mixed content (HTTP in HTTPS)
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        // Pause WebView when app is not in focus
        this.bridge.getWebView().onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Resume WebView when app comes back to focus
        this.bridge.getWebView().onResume();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Clean up WebView resources
        this.bridge.getWebView().clearCache(true);
        this.bridge.getWebView().clearFormData();
    }
}

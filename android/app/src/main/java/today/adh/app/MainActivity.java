package today.adh.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ===== IMMERSIVE MODE (Fullscreen video-ന് status bar hide ചെയ്യുക) =====
        // Window-ൽ FLAG_KEEP_SCREEN_ON set ചെയ്‌ത് video playing-ൽ screen ഓഫ് ആകാതിരിക്കുക
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Configure WebView for optimal performance and security
        this.bridge.getWebView().post(() -> {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // ===== AUDIO PLAYBACK =====
            // Allow audio playback without requiring user gesture
            // (Required for TTS affirmations and other audio features)
            settings.setMediaPlaybackRequiresUserGesture(false);

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

    /**
     * Immersive Sticky Mode — fullscreen video-ൽ status bar + nav bar hide ചെയ്യുക
     * @capacitor/status-bar plugin ഈ method internally call ചെയ്യും
     */
    private void enterImmersiveMode() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY        // Swipe ചെയ്‌താൽ auto-hide ആകും
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION       // Navigation bar hide
            | View.SYSTEM_UI_FLAG_FULLSCREEN             // Status bar hide
        );
    }

    /**
     * Normal Mode — status bar + nav bar restore ചെയ്യുക
     */
    private void exitImmersiveMode() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // App focus തിരിച്ചു കിട്ടുമ്പോൾ immersive mode restore ചെയ്യണോ check ചെയ്യുക
        // (notification bar swipe ചെയ്‌ത ശേഷം video-ലേക്ക് തിരിച്ചു വരുമ്പോൾ)
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

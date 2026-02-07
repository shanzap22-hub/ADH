# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.* class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.* *;
}

# Firebase
-keep class com.google.firebase.** { *; }
-keepclassmembers class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# OneSignal
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**

# Supabase / Networking
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView
-keep class android.webkit.** { *; }
-keepclassmembers class android.webkit.** { *; }

# Preserve line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
-renamesourcefileattribute SourceFile

# Capacitor Cordova plugins
-keep public class * extends org.apache.cordova.CordovaPlugin

# JSON serialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

package com.conzia.app

import android.annotation.SuppressLint
import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {
  private lateinit var webView: WebView
  private lateinit var assetLoader: WebViewAssetLoader

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val isDebuggable = (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    if (isDebuggable) {
      WebView.setWebContentsDebuggingEnabled(true)
    }

    assetLoader =
      WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
        .build()

    webView = WebView(this).apply {
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      settings.allowFileAccess = true
      settings.allowContentAccess = true
      settings.cacheMode = WebSettings.LOAD_DEFAULT

      webChromeClient =
        object : WebChromeClient() {
          override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
            Log.d(
              "CONZIAWebView",
              "${consoleMessage.messageLevel()}: ${consoleMessage.message()} (${consoleMessage.sourceId()}:${consoleMessage.lineNumber()})",
            )
            return super.onConsoleMessage(consoleMessage)
          }
        }
      webViewClient =
        object : WebViewClient() {
          override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest) =
            assetLoader.shouldInterceptRequest(request.url)
        }

      loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    setContentView(webView)

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          if (webView.canGoBack()) webView.goBack() else finish()
        }
      },
    )
  }

  override fun onDestroy() {
    webView.destroy()
    super.onDestroy()
  }
}

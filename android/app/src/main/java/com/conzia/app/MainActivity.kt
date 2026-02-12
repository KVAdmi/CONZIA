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

class MainActivity : ComponentActivity() {
  private lateinit var webView: WebView

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val isDebuggable = (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    if (isDebuggable) {
      WebView.setWebContentsDebuggingEnabled(true)
    }

    webView = WebView(this).apply {
      settings.javaScriptEnabled = true
      settings.domStorageEnabled = true
      settings.allowFileAccess = true
      settings.allowContentAccess = true
      settings.allowFileAccessFromFileURLs = true
      settings.allowUniversalAccessFromFileURLs = true
      settings.databaseEnabled = true
      settings.cacheMode = WebSettings.LOAD_DEFAULT
      settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
      settings.mediaPlaybackRequiresUserGesture = false
      setBackgroundColor(android.graphics.Color.parseColor("#0b1220"))

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
      
      webViewClient = object : WebViewClient() {
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
          super.onPageStarted(view, url, favicon)
          Log.d("CONZIAWebView", "Page started: $url")
        }

        override fun onPageFinished(view: WebView?, url: String?) {
          super.onPageFinished(view, url)
          Log.d("CONZIAWebView", "Page loaded successfully: $url")
        }

        override fun onReceivedError(
          view: WebView?,
          errorCode: Int,
          description: String?,
          failingUrl: String?
        ) {
          Log.e("CONZIAWebView", "Error $errorCode: $description at $failingUrl")
          super.onReceivedError(view, errorCode, description, failingUrl)
        }
      }

      Log.d("CONZIAWebView", "Loading from file:///android_asset/index.html")
      loadUrl("file:///android_asset/index.html")
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

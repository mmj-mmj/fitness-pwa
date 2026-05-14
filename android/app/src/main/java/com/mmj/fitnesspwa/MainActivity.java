package com.mmj.fitnesspwa;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = bridge.getWebView();
        getWindow().setBackgroundDrawable(new ColorDrawable(Color.rgb(243, 245, 248)));
        webView.setBackgroundColor(Color.rgb(243, 245, 248));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true);
        }
        webView.addJavascriptInterface(new AndroidFileExportBridge(this), "AndroidFileExport");
    }

    private static class AndroidFileExportBridge {
        private final MainActivity activity;

        AndroidFileExportBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void shareJson(String filename, String content) {
            activity.runOnUiThread(() -> activity.presentJsonShareSheet(filename, content));
        }
    }

    private void presentJsonShareSheet(String filename, String content) {
        if (filename == null || filename.trim().isEmpty() || content == null) return;

        String safeFilename = filename.replaceAll("[/\\\\?%*:|\"<>]", "-");
        File exportDir = new File(getCacheDir(), "exports");
        if (!exportDir.exists() && !exportDir.mkdirs()) return;

        File exportFile = new File(exportDir, safeFilename);
        try (FileOutputStream outputStream = new FileOutputStream(exportFile, false)) {
            outputStream.write(content.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {
            return;
        }

        Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", exportFile);
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("application/json");
        shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, safeFilename);
        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Intent chooser = Intent.createChooser(shareIntent, "导出 JSON");
        startActivity(chooser);
    }
}

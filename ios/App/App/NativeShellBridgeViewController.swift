import Capacitor
import UIKit
import WebKit

final class NativeShellBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler, UITabBarDelegate {
    private let nativeTabBar = UITabBar()
    private var nativeTabItems: [UITabBarItem] = []
    private var selectedTabIndex = 1
    private var didInstallShell = false

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        installNativeShellIfNeeded()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        installNativeShellIfNeeded()
    }

    private func installNativeShellIfNeeded() {
        guard !didInstallShell, let webView else { return }
        didInstallShell = true

        view.backgroundColor = NativeColors.appBackground
        configureWebView(webView)
        configureNativeTabBar()
        constrainShell(around: webView)
        setNeedsStatusBarAppearanceUpdate()
    }

    private func configureWebView(_ webView: WKWebView) {
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceVertical = true
        webView.configuration.userContentController.add(self, name: "nativeTab")
        webView.configuration.userContentController.add(self, name: "fileExport")
        webView.configuration.userContentController.addUserScript(Self.makeIOSNativeShellScript())
    }

    private func configureNativeTabBar() {
        nativeTabBar.translatesAutoresizingMaskIntoConstraints = false
        nativeTabBar.delegate = self
        nativeTabBar.isTranslucent = true
        nativeTabBar.itemPositioning = .fill
        nativeTabBar.tintColor = NativeColors.accent
        nativeTabBar.unselectedItemTintColor = .secondaryLabel
        nativeTabBar.backgroundColor = .clear
        nativeTabBar.items = makeTabItems()
        nativeTabItems = nativeTabBar.items ?? []
        nativeTabBar.selectedItem = nativeTabItems.first
        configureTabBarAppearance()
    }

    private func configureTabBarAppearance() {
        let appearance = UITabBarAppearance()

        if #available(iOS 26.0, *) {
            appearance.configureWithDefaultBackground()
            appearance.backgroundColor = .clear
        } else {
            appearance.configureWithTransparentBackground()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
            appearance.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.36)
            appearance.shadowColor = UIColor.separator.withAlphaComponent(0.18)
        }

        [appearance.stackedLayoutAppearance, appearance.inlineLayoutAppearance, appearance.compactInlineLayoutAppearance].forEach { itemAppearance in
            itemAppearance.selected.iconColor = NativeColors.accent
            itemAppearance.selected.titleTextAttributes = [.foregroundColor: NativeColors.accent]
            itemAppearance.normal.iconColor = .secondaryLabel
            itemAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor.secondaryLabel]
        }

        nativeTabBar.standardAppearance = appearance
        if #available(iOS 15.0, *) {
            nativeTabBar.scrollEdgeAppearance = appearance
        }
    }

    private func makeTabItems() -> [UITabBarItem] {
        [
            makeTabItem(title: "首页", image: "house", selectedImage: "house.fill", tabIndex: 1),
            makeTabItem(title: "记录", image: "dumbbell", selectedImage: "dumbbell.fill", tabIndex: 2),
            makeTabItem(title: "历史", image: "clock.arrow.circlepath", selectedImage: "clock.arrow.circlepath", tabIndex: 3),
            makeTabItem(title: "统计", image: "chart.line.uptrend.xyaxis", selectedImage: "chart.line.uptrend.xyaxis", tabIndex: 4),
            makeTabItem(title: "我的", image: "person.crop.circle", selectedImage: "person.crop.circle.fill", tabIndex: 5)
        ]
    }

    private func makeTabItem(title: String, image: String, selectedImage: String, tabIndex: Int) -> UITabBarItem {
        UITabBarItem(
            title: title,
            image: UIImage(systemName: image),
            selectedImage: UIImage(systemName: selectedImage)
        ).configured(tag: tabIndex)
    }

    private func constrainShell(around webView: WKWebView) {
        view.addSubview(nativeTabBar)

        NSLayoutConstraint.activate([
            nativeTabBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            nativeTabBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            nativeTabBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            nativeTabBar.heightAnchor.constraint(equalToConstant: 84),

            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func selectWebTab(tabIndex: Int) {
        setNativeTabSelection(tabIndex: tabIndex)
        runWebNavigationScript(tabIndex: tabIndex)
    }

    private func setNativeTabSelection(tabIndex: Int) {
        guard nativeTabItems.indices.contains(tabIndex - 1) else { return }
        selectedTabIndex = tabIndex
        nativeTabBar.selectedItem = nativeTabItems[tabIndex - 1]
    }

    private func runWebNavigationScript(tabIndex: Int) {
        let script = "document.querySelector('.bottom-tabs button:nth-child(\(tabIndex))')?.click();"
        webView?.evaluateJavaScript(script)
    }

    private static func makeIOSNativeShellScript() -> WKUserScript {
        let source = """
        (() => {
          const style = document.createElement('style');
          style.textContent = `
            .bottom-tabs {
              display: none !important;
            }

            .app-shell {
              padding-top: calc(20px + env(safe-area-inset-top)) !important;
              padding-bottom: calc(128px + env(safe-area-inset-bottom)) !important;
            }
          `;
          document.documentElement.dataset.nativeIosShell = 'true';
          document.head.appendChild(style);

          var lastIndex = -1;
          const syncNativeTab = () => {
            const buttons = [...document.querySelectorAll('.bottom-tabs button')];
            const index = buttons.findIndex((button) => button.getAttribute('aria-current') === 'page');
            if (index >= 0 && index !== lastIndex) {
              lastIndex = index;
              window.webkit?.messageHandlers?.nativeTab?.postMessage(index + 1);
            }
          };

          setInterval(syncNativeTab, 250);
          window.addEventListener('load', syncNativeTab);
        })();
        """

        return WKUserScript(source: source, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
    }

    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        guard item.tag != selectedTabIndex else { return }
        selectWebTab(tabIndex: item.tag)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "nativeTab", let tabIndex = message.body as? Int {
            setNativeTabSelection(tabIndex: tabIndex)
            return
        }

        if message.name == "fileExport" {
            presentExportPanel(from: message.body)
        }
    }

    private func presentExportPanel(from body: Any) {
        guard
            let payload = body as? [String: Any],
            let filename = payload["filename"] as? String,
            let content = payload["content"] as? String,
            let data = content.data(using: .utf8)
        else { return }

        let safeFilename = filename
            .components(separatedBy: CharacterSet(charactersIn: "/:\\?%*|\"<>"))
            .joined(separator: "-")
        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(safeFilename)

        do {
            try data.write(to: fileURL, options: .atomic)
        } catch {
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let activityController = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)

            if let popover = activityController.popoverPresentationController {
                popover.sourceView = self.view
                popover.sourceRect = CGRect(x: self.view.bounds.midX, y: self.view.bounds.midY, width: 1, height: 1)
                popover.permittedArrowDirections = []
            }

            activityController.completionWithItemsHandler = { _, _, _, _ in
                try? FileManager.default.removeItem(at: fileURL)
            }

            if self.presentedViewController == nil {
                self.present(activityController, animated: true)
            }
        }
    }
}

private extension UITabBarItem {
    func configured(tag: Int) -> UITabBarItem {
        self.tag = tag
        return self
    }
}

private enum NativeColors {
    static let appBackground = UIColor(red: 243 / 255, green: 245 / 255, blue: 248 / 255, alpha: 1)
    static let accent = UIColor(red: 99 / 255, green: 84 / 255, blue: 182 / 255, alpha: 1)
}

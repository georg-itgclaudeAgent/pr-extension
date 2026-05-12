import React, { useState, useEffect } from "react";
import { useSettings } from "./hooks/useSettings";
import { useHeyGenSettings } from "./hooks/useHeyGenSettings";
import { useAssetsSettings } from "./hooks/useAssetsSettings";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import { TransferredAudio } from "./types";
import { Settings } from "./components/Settings";
import { MainPanel } from "./components/MainPanel";
import { HeyGenPanel } from "./components/HeyGenPanel";
import { HeyGenSettingsView } from "./components/HeyGenSettings";
import { AssetsPanel } from "./components/AssetsPanel";
import { AssetsSettingsView } from "./components/AssetsSettings";
import { UpdateModal } from "./components/UpdateModal";
import { UpdateNewPill } from "./components/UpdateNewPill";

function registerKeyboardShortcuts() {
  try {
    const cs = new (window as any).CSInterface();
    const keys = [
      { keyCode: 86, ctrlKey: true },
      { keyCode: 67, ctrlKey: true },
      { keyCode: 88, ctrlKey: true },
      { keyCode: 65, ctrlKey: true },
      { keyCode: 90, ctrlKey: true },
    ];
    cs.registerKeyEventsInterest(JSON.stringify(keys));
  } catch (e) {}
}

type Tab = "elevenlabs" | "heygen" | "assets";
type SettingsView = "none" | "elevenlabs" | "heygen" | "assets";

export const App = () => {
  const { settings: elSettings, updateSettings: updateElSettings, isConfigured: elConfigured } = useSettings();
  const { settings: hgSettings, updateSettings: updateHgSettings } = useHeyGenSettings();
  const { settings: asSettings, updateSettings: updateAsSettings } = useAssetsSettings();

  const [settingsView, setSettingsView] = useState<SettingsView>(elConfigured ? "none" : "elevenlabs");
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("elevenlabs");
  const [transferredAudio, setTransferredAudio] = useState<TransferredAudio | null>(null);
  const [heygenBadge, setHeygenBadge] = useState(false);

  const update = useUpdateCheck();
  const [sessionDismissed, setSessionDismissed] = useState(false);

  useEffect(() => {
    registerKeyboardShortcuts();
  }, []);

  const showElSettings = settingsView === "elevenlabs" || (!elConfigured && activeTab === "elevenlabs");
  const showHgSettings = settingsView === "heygen";
  const showAsSettings = settingsView === "assets";

  const updateAvailable = update.state.status === "available";
  const showUpdateModal =
    updateAvailable && !update.state.dismissed && !sessionDismissed;
  const showUpdateNewPill = updateAvailable && update.state.dismissed;

  return (
    <div className="app-layout">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "elevenlabs" ? "active" : ""}`}
          onClick={() => setActiveTab("elevenlabs")}
        >
          ElevenLabs
        </button>
        <button
          className={`tab-btn ${activeTab === "heygen" ? "active" : ""}`}
          onClick={() => { setActiveTab("heygen"); setHeygenBadge(false); }}
        >
          HeyGen
          {heygenBadge && <span className="tab-badge" />}
        </button>
        <button
          className={`tab-btn ${activeTab === "assets" ? "active" : ""}`}
          onClick={() => setActiveTab("assets")}
        >
          Assets
        </button>
        {showUpdateNewPill && (
          <>
            <div style={{ flex: 1 }} />
            <UpdateNewPill
              title={
                update.state.status === "available"
                  ? `Version ${update.state.latest.version} available`
                  : undefined
              }
              onClick={() => setSessionDismissed(false)}
            />
          </>
        )}
      </div>

      {activeTab === "elevenlabs" && (
        showElSettings ? (
          <Settings
            settings={elSettings}
            onUpdate={updateElSettings}
            onBack={() => setSettingsView("none")}
          />
        ) : (
          <MainPanel
            settings={elSettings}
            onUpdate={updateElSettings}
            onOpenSettings={() => setSettingsView("elevenlabs")}
            text={text}
            onTextChange={setText}
            onTransferToHeyGen={(audio) => setTransferredAudio(audio)}
          />
        )
      )}

      {activeTab === "heygen" && (
        showHgSettings ? (
          <HeyGenSettingsView
            settings={hgSettings}
            onUpdate={updateHgSettings}
            onBack={() => setSettingsView("none")}
          />
        ) : (
          <HeyGenPanel
            settings={hgSettings}
            onUpdate={updateHgSettings}
            onOpenSettings={() => setSettingsView("heygen")}
            transferredAudio={transferredAudio}
            onClearTransferredAudio={() => setTransferredAudio(null)}
            onBadgeChange={(show) => {
              if (!show || activeTab !== "heygen") setHeygenBadge(show);
            }}
            isActiveTab={activeTab === "heygen"}
          />
        )
      )}

      {activeTab === "assets" && (
        showAsSettings ? (
          <AssetsSettingsView
            settings={asSettings}
            onUpdate={updateAsSettings}
            onBack={() => setSettingsView("none")}
          />
        ) : (
          <AssetsPanel
            settings={asSettings}
            onUpdate={updateAsSettings}
            onOpenSettings={() => setSettingsView("assets")}
          />
        )
      )}

      {showUpdateModal && update.state.status === "available" && (
        <UpdateModal
          installed={update.state.installed}
          latest={update.state.latest}
          onClose={() => setSessionDismissed(true)}
          onDismissForever={() => {
            update.dismiss();
            setSessionDismissed(true);
          }}
        />
      )}
    </div>
  );
};

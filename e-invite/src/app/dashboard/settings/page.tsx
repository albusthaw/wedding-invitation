"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [brandName, setBrandName] = useState("E-Invite");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-3.1-flash-lite-preview");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [brandMessage, setBrandMessage] = useState("");
  const [allMessage, setAllMessage] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.brandName) setBrandName(data.brandName);
          if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
          if (data.geminiModel) setGeminiModel(data.geminiModel);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSaveBrand() {
    setSavingBrand(true);
    setBrandMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName }),
      });
      if (res.ok) {
        setBrandMessage("Brand name saved successfully");
        setTimeout(() => setBrandMessage(""), 3000);
      } else {
        setBrandMessage("Failed to save brand name");
      }
    } catch {
      setBrandMessage("An error occurred while saving");
    } finally {
      setSavingBrand(false);
    }
  }

  async function handleSaveAll() {
    setSavingAll(true);
    setAllMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, geminiApiKey, geminiModel }),
      });
      if (res.ok) {
        setAllMessage("All settings saved successfully");
        setTimeout(() => setAllMessage(""), 3000);
      } else {
        setAllMessage("Failed to save settings");
      }
    } catch {
      setAllMessage("An error occurred while saving");
    } finally {
      setSavingAll(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiApiKey, model: geminiModel }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Failed to test connection" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your E-Invite system</p>
      </div>

      <div className="space-y-8">
        {/* Brand Settings */}
        <div className="bg-[#1a1a3e] rounded-xl border border-gray-800 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#c9a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Brand Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="E-Invite"
                className="w-full px-4 py-3 rounded-lg bg-[#0f0f23] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition-all"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                This name appears in the sidebar and throughout the dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveBrand}
                disabled={savingBrand}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-black bg-[#c9a96e] hover:bg-[#b8953d] transition-colors disabled:opacity-50"
              >
                {savingBrand ? "Saving..." : "Save"}
              </button>
              {brandMessage && (
                <p className={`text-sm ${brandMessage.includes("success") ? "text-green-400" : "text-red-400"}`}>
                  {brandMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gemini AI Integration */}
        <div className="bg-[#1a1a3e] rounded-xl border border-gray-800 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#c9a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Gemini AI Integration
            </h2>
            {testResult && (
              <div className="flex items-center gap-1.5">
                {testResult.success ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={`text-xs font-medium ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                  {testResult.success ? "Connected" : "Failed"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-[#0f0f23] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1.5">
                Get your API key from Google AI Studio
              </p>
            </div>

            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Model Name
              </label>
              <input
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="gemini-3.1-flash-lite-preview"
                className="w-full px-4 py-3 rounded-lg bg-[#0f0f23] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e] transition-all font-mono text-sm"
              />
              <p className="text-gray-500 text-xs mt-1.5">
                Default: gemini-3.1-flash-lite-preview
              </p>
            </div>

            {/* Test Connection */}
            <div>
              <button
                onClick={handleTestConnection}
                disabled={testing || !geminiApiKey}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#252550] border border-gray-700 text-white hover:bg-[#303068] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg text-sm ${
                  testResult.success
                    ? "bg-green-900/20 border border-green-700/30 text-green-400"
                    : "bg-red-900/20 border border-red-700/30 text-red-400"
                }`}
              >
                {testResult.success ? (
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Save All Settings */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {allMessage && (
            <p className={`text-sm ${allMessage.includes("success") ? "text-green-400" : "text-red-400"}`}>
              {allMessage}
            </p>
          )}
          <div className="sm:ml-auto">
            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="px-8 py-3 rounded-lg text-sm font-semibold text-black bg-[#c9a96e] hover:bg-[#b8953d] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingAll && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
              {savingAll ? "Saving..." : "Save All Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

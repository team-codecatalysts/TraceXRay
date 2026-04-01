"use client"

import { useState, useEffect } from "react"
import { analyzeUrlStage2 } from "../lib/apiClient"
import { Link } from "react-router-dom"

import CircularScoreCard from "../components/Stage2_URLResult/CircularScoreCard"
import InfoCard from "../components/Stage2_URLResult/InfoCard"
import LoadingState from "../components/Stage2_URLResult/LoadingState"
import { ChevronLeft, Search, Lock } from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers — all data extraction and derived values live here, not inline JSX
// ---------------------------------------------------------------------------

/** Pull entropy from wherever the backend actually puts it */
function getEntropy(result) {
  return (
    result?.analysis?.url_features?.entropy ??
    result?.entropy_score ??
    0
  )
}

/** Pull domain age, returning null when backend signals unknown (-1 / missing) */
function getDomainAgeDays(result) {
  const age =
    result?.analysis?.whois?.domain_age_days ??
    result?.domain_age_days ??
    null
  return age !== null && age >= 0 ? age : null
}

/** Human-readable domain age — never shows raw -1 */
function formatDomainAge(ageDays) {
  if (ageDays === null) return "Unknown"
  if (ageDays === 0)    return "< 1 day"
  if (ageDays < 365)    return `${ageDays} days`
  const years = Math.floor(ageDays / 365)
  const months = Math.floor((ageDays % 365) / 30)
  if (months === 0) return `${years} yr`
  return `${years} yr ${months} mo`
}

/** Risk band for domain age card */
function domainAgeRisk(ageDays) {
  if (ageDays === null) return "Medium"   // unknown = cautious
  if (ageDays < 30)    return "High"
  if (ageDays < 180)   return "Medium"
  return "Low"
}

/**
 * Trust Stability (0–100):
 *   logarithmic age maturity, dampened by entropy.
 *   Guarded against division-by-zero and NaN/Infinity.
 */
function calcTrustStability(result) {
  const ageDays = getDomainAgeDays(result)
  const entropy = getEntropy(result)

  // Unknown age → can't determine stability
  if (ageDays === null) return null

  // entropy=0 means a trivially short/empty URL — treat as low entropy, not ∞
  const safeEntropy = entropy > 0 ? entropy : 1

  const raw = Math.log(ageDays + 1) / safeEntropy
  const score = Math.min(100, Math.round(raw * 20))

  // Final guard — should never be needed but keeps UI safe
  return isFinite(score) ? Math.max(0, score) : null
}

/** Entropy as 0-100 for the CircularScoreCard */
function calcEntropyScore(result) {
  const entropy = getEntropy(result)
  return Math.min(100, Math.round(entropy * 20))
}

// ---------------------------------------------------------------------------

export default function URLResult() {
  const [firstUrl, setFirstUrl]  = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (!chrome?.storage) return
    chrome.storage.local.get(["stage1_first_url"], (res) => {
      if (res.stage1_first_url) setFirstUrl(res.stage1_first_url)
    })
  }, [])

  const handleAnalyze = async () => {
    if (!firstUrl) return
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      const data = await analyzeUrlStage2(firstUrl)
      setResult(data)
      console.log("[stage2 result]", data)
      chrome.storage.local.set({ stage2_output: data })
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.detail || "Stage 2 failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (firstUrl) handleAnalyze()
  }, [firstUrl])

  // Derived display values — computed once, used below
  const ageDays        = getDomainAgeDays(result)
  const entropyScore   = calcEntropyScore(result)
  const trustScore     = calcTrustStability(result)

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">

      {/* Nav */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to="/url-extractor"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#006b7d] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-3xl border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <Search className="w-4 h-4" />
              Learn how it works
            </button>
            {result && (
              <Link
                to="/sandbox"
                state={result}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-3xl bg-[#006b7d] text-white text-sm font-medium shadow hover:opacity-95 transition"
              >
                <Lock className="w-4 h-4" />
                Continue to Sandbox
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Header */}
        <div className="w-full flex flex-col items-center justify-center py-10">
          <div className="flex items-center gap-6">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
              </svg>
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 relative">
              URL Risk Score
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#4db5c4] to-transparent rounded-full" />
            </h1>
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-10">
            Automated security evaluation · Zero user exposure
          </p>
        </div>

        {/* URL card */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/60 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 animate-pulse" />
          <div className="relative flex items-center gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500 mb-2">Analyzing Target URL</div>
              <div className="text-md font-semibold text-gray-900 truncate">
                {firstUrl || "No URL provided"}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-green-700">Live Scan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && <LoadingState />}

        {error && (
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-red-50 rounded-3xl border border-red-200 shadow-xl p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full blur-3xl" />
            <div className="relative flex items-start gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h3>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Domain Intelligence */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                <h2 className="text-2xl font-semibold text-gray-900">Domain Intelligence</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <InfoCard
                  label="Domain"
                  value={result.analysis?.domain || result.final_domain || "Unknown"}
                  description="Resolved destination after all redirects"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  }
                />

                <InfoCard
                  label="Domain Age"
                  value={formatDomainAge(ageDays)}
                  description={
                    ageDays === null
                      ? "Registration date could not be determined"
                      : "Time elapsed since domain registration"
                  }
                  riskLevel={domainAgeRisk(ageDays)}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <InfoCard
                  label="Risk Level"
                  value={result.risk_level || "Unknown"}
                  description="AI-powered threat severity classification"
                  riskLevel={result.risk_level}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                />

              </div>
            </div>

            {/* Security Analysis */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <h2 className="text-2xl font-semibold text-gray-900">Security Analysis</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <CircularScoreCard
                  title="Threat Score"
                  subtitle="Composite risk indicator from all detected security signals"
                  score={result.overall_threat_score ?? 0}
                  type="threat"
                />

                <CircularScoreCard
                  title="Entropy Score"
                  subtitle="URL randomness level indicating obfuscation attempts"
                  score={entropyScore}
                  type="entropy"
                />

                {/* Trust Stability — gracefully handles unknown age */}
                {trustScore !== null ? (
                  <CircularScoreCard
                    title="Trust Stability"
                    subtitle="Domain maturity correlation for reliability measure"
                    score={trustScore}
                    type="stability"
                  />
                ) : (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-700">Trust Stability</p>
                    <p className="text-xs text-gray-500">Domain maturity correlation for reliability measure</p>
                    <div className="flex-1 flex items-center justify-center mt-4">
                      <span className="text-sm text-gray-400 italic">
                        Unavailable — registration date unknown
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
import { useState, useEffect } from 'react';
import ForensicReport from '../components/Stage4_ForensicReport/ForensicReport';

const ForensicReportPage = () => {
  const [stage1Data, setStage1Data] = useState({ extracted_urls: ['https://example.com'] });
  const [stage2Data, setStage2Data] = useState({ overall_threat_score: 95 });
  const [stage3Data, setStage3Data] = useState({ verdict: { riskLevel: 'CRITICAL' } });

  useEffect(() => {
    if (!chrome?.storage) return
    chrome.storage.local.get(["stage1_output", "stage2_output", "stage3_output"], (res) => {
      if (res.stage1_output) setStage1Data(res.stage1_output)
      if (res.stage2_output) setStage2Data(res.stage2_output)
      if (res.stage3_output) setStage3Data(res.stage3_output)
    })
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        <ForensicReport 
          stage1Data={stage1Data} 
          stage2Data={stage2Data} 
          stage3Data={stage3Data} 
        />
      </div>
    </div>
  );
};

export default ForensicReportPage;
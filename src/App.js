import React, { useState } from 'react';
import './app.css';

function App() {
  const [activeTab, setActiveTab] = useState('converter');
  const [language, setLanguage] = useState('Python');
  const [serialCode, setSerialCode] = useState('');
  const [parallelCode, setParallelCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [cores, setCores] = useState(1);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('llama-2-7b');

  const detectLanguage = (code) => {
    if (!code.trim()) return null;

    if (code.includes('#include') || code.includes('using namespace') || code.includes('int main')) {
      return 'C++';
    } else if (code.includes('import java.') || code.includes('public class') || code.includes('public static void main')) {
      return 'Java';
    } else if (code.includes('import ') && (code.includes('numpy') || code.includes('mpi4py'))) {
      return 'Python';
    } else if (code.includes('def ') || code.includes('import ')) {
      return 'Python';
    }
    return null;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setInputCode(code);
    const detectedLang = detectLanguage(code);
    if (detectedLang) setLanguage(detectedLang);
  };

  const handleSerialCodeChange = (e) => {
    const code = e.target.value;
    setSerialCode(code);
    const detectedLang = detectLanguage(code);
    if (detectedLang) setLanguage(detectedLang);
  };

  const handleParallelCodeChange = (e) => {
    setParallelCode(e.target.value);
  };

  const handleCoresChange = (e) => {
    setCores(parseInt(e.target.value) || 1);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
  };

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const detectedLang = detectLanguage(content);
      if (detectedLang) setLanguage(detectedLang);

      if (target === 'input') setInputCode(content);
      else if (target === 'serial') setSerialCode(content);
      else if (target === 'parallel') setParallelCode(content);
    };
    reader.readAsText(file);
  };

  const callLlamaApi = async (prompt) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response based on prompt content
      if (prompt.includes('Convert the following')) {
        return mockParallelCode(inputCode, language);
      } else if (prompt.includes('Explain how to parallelize')) {
        return mockExplanation(inputCode, language);
      } else if (prompt.includes('Optimize the following')) {
        return mockOptimizedCode(parallelCode, language);
      } else {
        return mockPerformanceAnalysis(serialCode, parallelCode, language, cores);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock functions for demonstration
  const mockParallelCode = (code, lang) => {
    if (lang === 'Python') {
      return `from mpi4py import MPI\nimport numpy as np\n\n${code.replace('for ', 'for i in range(comm.Get_rank(), len(data), comm.Get_size()):')}`;
    } else if (lang === 'C++') {
      return `#include <omp.h>\n\n${code.replace('for (int i = 0', '#pragma omp parallel for\n        for (int i = 0')}`;
    }
    return code;
  };

  const mockExplanation = (code, lang) => {
    return `This ${lang} code can be parallelized by:\n1. Identifying the independent loops\n2. Using ${lang === 'Python' ? 'MPI' : 'OpenMP'} directives\n3. Distributing data across processes`;
  };

  const mockOptimizedCode = (code, lang) => {
    return code + `\n\n// Optimized with better load balancing`;
  };

  const mockPerformanceAnalysis = (serial, parallel, lang, cores) => {
    return JSON.stringify({
      serialTime: (Math.random() * 10).toFixed(3),
      parallelTime: (Math.random() * 5).toFixed(3),
      speedup: (Math.random() * 3 + 1).toFixed(2),
      serialCpu: (Math.random() * 30 + 70).toFixed(1),
      parallelCpu: (Math.random() * 50 + 50).toFixed(1),
      serialMem: (Math.random() * 20 + 50).toFixed(1),
      parallelMem: (Math.random() * 30 + 60).toFixed(1)
    }, null, 2);
  };

  const convertCode = async () => {
    if (!inputCode.trim()) {
      setError("Please enter the serial code to convert.");
      return;
    }

    const prompt = `Convert the following ${language} serial code to parallel code. Provide only the code with no additional explanation.\n\nSerial code:\n${inputCode}\n\nParallel ${language} code:`;
    const parallelCode = await callLlamaApi(prompt);
    if (parallelCode) {
      setOutputCode(parallelCode);
      setParallelCode(parallelCode);
    }
  };

  const explainCode = async () => {
    if (!inputCode.trim()) {
      setError("Please enter the serial code to explain.");
      return;
    }

    const prompt = `Explain how to parallelize the following ${language} code and identify the parallelizable sections. Provide a detailed explanation.\n\nCode:\n${inputCode}\n\nExplanation:`;
    const explanation = await callLlamaApi(prompt);
    if (explanation) setOutputCode(explanation);
  };

  const optimizeCode = async () => {
    if (!parallelCode.trim()) {
      setError("Please enter the parallel code to optimize.");
      return;
    }

    const prompt = `Optimize the following ${language} parallel code for better performance. Provide only the optimized code with no additional explanation.\n\nParallel code:\n${parallelCode}\n\nOptimized parallel ${language} code:`;
    const optimizedCode = await callLlamaApi(prompt);
    if (optimizedCode) {
      setOutputCode(optimizedCode);
      setParallelCode(optimizedCode);
    }
  };

  const comparePerformance = async () => {
    if (!serialCode.trim() || !parallelCode.trim()) {
      setError("Please provide both serial and parallel code for comparison.");
      return;
    }

    const prompt = `Analyze and compare the performance of these two ${language} code implementations. The first is serial and the second is parallel. 
    Estimate the execution time, speedup, CPU usage, and memory usage for both. Provide the results in JSON format with these keys: 
    serialTime, parallelTime, speedup, serialCpu, parallelCpu, serialMem, parallelMem.\n\nSerial code:\n${serialCode}\n\nParallel code:\n${parallelCode}\n\nNumber of cores: ${cores}\n\nResults:`;
    
    const analysis = await callLlamaApi(prompt);
    try {
      const parsedResults = JSON.parse(analysis);
      setResults(parsedResults);
    } catch (err) {
      setError("Failed to parse performance analysis results.");
    }
  };

  const saveOutput = () => {
    if (!outputCode.trim()) {
      setError("No output code to save.");
      return;
    }

    const extension = language === 'Python' ? '.py' : language === 'C++' ? '.cpp' : '.java';
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parallel_code${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!outputCode.trim()) {
      setError("No output code to copy.");
      return;
    }
    navigator.clipboard.writeText(outputCode)
      .then(() => alert('Output code copied to clipboard!'));
  };

  return (
    <div className="container">
      <h1>Serial to Parallel Code Converter</h1>

      <div className="tab-container">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'converter' ? 'active' : ''}`}
            onClick={() => handleTabChange('converter')}
          >
            Code Converter
          </button>
          <button 
            className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => handleTabChange('comparison')}
          >
            Performance Comparison
          </button>
        </div>
        
        <div className="api-settings">
          <div className="form-group">
            <label>Model:</label>
            <select value={model} onChange={handleModelChange}>
              {/* <option value="llama-2-7b">LLaMA 2 7B</option>
              <option value="llama-2-13b">LLaMA 2 13B</option>
              <option value="llama-2-70b">LLaMA 2 70B</option> */}
              <option value="codellama">CodeLLaMA</option>
            </select>
          </div>
        </div>
        
        {error && <div className="error">{error}</div>}
        {isLoading && <div className="loading">Processing with LLaMA...</div>}
        
        {/* Converter Tab */}
        <div className={activeTab !== 'converter' ? 'hidden' : ''}>
          <div className="form-group">
            <label>Select Programming Language:</label>
            <select value={language} onChange={handleLanguageChange}>
              <option value="Python">Python</option>
              <option value="C++">C++</option>
              <option value="Java">Java</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Enter Serial Code:</label>
            <textarea 
              value={inputCode} 
              onChange={handleCodeChange}
              placeholder={`Enter your ${language} serial code here...`}
            />
          </div>
          
          <div className="button-group">
            <label className="button">
              Upload Serial Code
              <input 
                type="file" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'input')}
                accept=".py,.cpp,.java,.txt"
              />
            </label>
            <button onClick={convertCode} disabled={isLoading}>
              Convert to Parallel
            </button>
            <button onClick={explainCode} disabled={isLoading}>
              Explain Parallelization
            </button>
          </div>
          
          <div className="form-group">
            <label>Output:</label>
            <textarea 
              value={outputCode} 
              readOnly
              placeholder="Your parallel code or explanation will appear here..."
            />
          </div>
          
          <div className="button-group">
            <button onClick={saveOutput} disabled={!outputCode.trim()}>
              Save Output
            </button>
            <button onClick={copyToClipboard} disabled={!outputCode.trim()}>
              Copy to Clipboard
            </button>
            <button onClick={optimizeCode} disabled={!parallelCode.trim() || isLoading}>
              Optimize Code
            </button>
          </div>
        </div>
        
        {/* Comparison Tab */}
        <div className={activeTab !== 'comparison' ? 'hidden' : ''}>
          <div className="form-group">
            <label>Select Programming Language:</label>
            <select value={language} onChange={handleLanguageChange}>
              <option value="Python">Python</option>
              <option value="C++">C++</option>
              <option value="Java">Java</option>
            </select>
          </div>
          
          {(language === 'Python' || language === 'Java') && (
            <div className="form-group">
              <label>Number of Cores:</label>
              <input 
                type="number" 
                min="1" 
                value={cores} 
                onChange={handleCoresChange}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Enter Serial Code:</label>
            <textarea 
              value={serialCode} 
              onChange={handleSerialCodeChange}
              placeholder={`Enter your ${language} serial code here...`}
            />
          </div>
          
          <div className="button-group">
            <label className="button">
              Upload Serial Code
              <input 
                type="file" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'serial')}
                accept=".py,.cpp,.java,.txt"
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>Enter Parallel Code:</label>
            <textarea 
              value={parallelCode} 
              onChange={handleParallelCodeChange}
              placeholder={`Enter your ${language} parallel code here...`}
            />
          </div>
          
          <div className="button-group">
            <label className="button">
              Upload Parallel Code
              <input 
                type="file" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e, 'parallel')}
                accept=".py,.cpp,.java,.txt"
              />
            </label>
            <button onClick={comparePerformance} disabled={isLoading}>
              Compare Performance
            </button>
          </div>
          
          {results && (
            <div className="results">
              <h3>Performance Comparison Results</h3>
              <div className="metrics-grid">
                <div className="metric">
                  <span>Serial Execution Time:</span>
                  <span>{results.serialTime} seconds</span>
                </div>
                <div className="metric">
                  <span>Parallel Execution Time:</span>
                  <span>{results.parallelTime} seconds</span>
                </div>
                <div className="metric highlight">
                  <span>Speedup:</span>
                  <span>{results.speedup}x</span>
                </div>
                <div className="metric">
                  <span>Serial CPU Usage:</span>
                  <span>{results.serialCpu}%</span>
                </div>
                <div className="metric">
                  <span>Parallel CPU Usage:</span>
                  <span>{results.parallelCpu}%</span>
                </div>
                <div className="metric">
                  <span>Serial Memory Usage:</span>
                  <span>{results.serialMem}%</span>
                </div>
                <div className="metric">
                  <span>Parallel Memory Usage:</span>
                  <span>{results.parallelMem}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
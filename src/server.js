const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Helper function to execute code and measure performance
async function measureExecution(code, language, cores = 1) {
  return new Promise((resolve, reject) => {
    let filename, compileCommand, runCommand;
    const tempDir = path.join(__dirname, 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    if (language === 'Python') {
      filename = path.join(tempDir, 'temp_code.py');
      runCommand = `mpiexec -np ${cores} python ${filename}`;
    } else if (language === 'C++') {
      filename = path.join(tempDir, 'temp_code.cpp');
      const executable = path.join(tempDir, 'temp_code');
      compileCommand = `g++ ${filename} -o ${executable} -fopenmp`;
      runCommand = executable;
    } else {
      return reject(new Error('Unsupported language'));
    }

    fs.writeFileSync(filename, code);

    if (compileCommand) {
      exec(compileCommand, (compileError) => {
        if (compileError) {
          return reject(new Error(`Compilation failed: ${compileError.message}`));
        }
        executeCode(runCommand);
      });
    } else {
      executeCode(runCommand);
    }

    function executeCode(command) {
      const startTime = process.hrtime();
      const cpuUsages = [];
      const memoryUsages = [];

      // Start monitoring resources
      const monitorInterval = setInterval(() => {
        cpuUsages.push(process.cpuUsage());
        memoryUsages.push(process.memoryUsage().heapUsed);
      }, 100);

      const child = exec(command, (error, stdout, stderr) => {
        clearInterval(monitorInterval);
        
        if (error) {
          return reject(new Error(`Execution failed: ${error.message}`));
        }

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const executionTime = seconds + nanoseconds / 1e9;

        // Calculate max CPU and memory usage
        const maxCpu = Math.max(...cpuUsages.map(usage => (usage.user + usage.system) / 1000));
        const maxMem = Math.max(...memoryUsages) / (1024 * 1024); // Convert to MB

        resolve({
          executionTime,
          maxCpu,
          maxMem,
          output: stdout
        });
      });
    }
  });
}

// Convert serial code to parallel
app.post('/convert', async (req, res) => {
  const { code, language } = req.body;
  
  try {
    let prompt;
    if (language === 'Python') {
      prompt = `Convert the following Python code to parallel code using MPI. Only return the parallel code without any comments.\n${code}`;
    } else if (language === 'C++') {
      prompt = `Convert the following C++ code to parallel code using OpenMP. Only return the parallel code.\n${code}`;
    } else {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    // Call Ollama via child process
    const child = exec(`ollama run codellama:13b -- "${prompt}"`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: stderr });
      }
      res.json({ output: stdout.trim() });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare performance of serial and parallel code
app.post('/compare', async (req, res) => {
  const { serialCode, parallelCode, language, cores } = req.body;
  
  try {
    const [serialResult, parallelResult] = await Promise.all([
      measureExecution(serialCode, language),
      measureExecution(parallelCode, language, cores)
    ]);

    res.json({
      serialTime: serialResult.executionTime,
      parallelTime: parallelResult.executionTime,
      serialCpu: serialResult.maxCpu,
      parallelCpu: parallelResult.maxCpu,
      serialMem: serialResult.maxMem,
      parallelMem: parallelResult.maxMem
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
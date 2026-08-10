import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';
import 'dart:math';

class Win96CalculatorModule extends StatefulWidget {
  const Win96CalculatorModule({super.key});

  @override
  State<Win96CalculatorModule> createState() => _Win96CalculatorModuleState();
}

class _Win96CalculatorModuleState extends State<Win96CalculatorModule> {
  String _display = '0';
  String _benchmarkResult = 'Ei ajettu.';

  void _appendNumber(String val) {
    setState(() {
      if (_display == '0') {
        _display = val;
      } else {
        _display += val;
      }
    });
  }

  void _clear() {
    setState(() {
      _display = '0';
      _benchmarkResult = 'Nollattu.';
    });
  }

  void _runBenchmark() {
    setState(() {
      final stopwatch = Stopwatch()..start();
      double result = 0;
      for (int i = 0; i < 1000000; i++) {
        result += sin(i.toDouble()) * cos(i.toDouble());
      }
      stopwatch.stop();
      _display = result.toStringAsFixed(4);
      _benchmarkResult = 'FPU Testi valmis: ${stopwatch.elapsedMilliseconds} ms';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '🧮 Win96 Calculator & Math Co-Processor',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _benchmarkResult,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _display,
            textAlign: TextAlign.right,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 24, fontFamily: 'monospace', fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(onPressed: () => _appendNumber('7'), child: const Text(' 7 ')),
            Button(onPressed: () => _appendNumber('8'), child: const Text(' 8 ')),
            Button(onPressed: () => _appendNumber('9'), child: const Text(' 9 ')),
            Button(onPressed: () => _appendNumber('4'), child: const Text(' 4 ')),
            Button(onPressed: () => _appendNumber('5'), child: const Text(' 5 ')),
            Button(onPressed: () => _appendNumber('6'), child: const Text(' 6 ')),
            Button(onPressed: () => _appendNumber('1'), child: const Text(' 1 ')),
            Button(onPressed: () => _appendNumber('2'), child: const Text(' 2 ')),
            Button(onPressed: () => _appendNumber('3'), child: const Text(' 3 ')),
            Button(onPressed: () => _appendNumber('0'), child: const Text(' 0 ')),
            Button(onPressed: _clear, child: const Text('C')),
            FilledButton(onPressed: _runBenchmark, child: const Text('FPU Benchmark')),
          ],
        ),
      ],
    );
  }
}

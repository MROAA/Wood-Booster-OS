import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentTwinModule extends StatefulWidget {
  const DigitalEnvironmentTwinModule({super.key});

  @override
  State<DigitalEnvironmentTwinModule> createState() => _DigitalEnvironmentTwinModuleState();
}

class _DigitalEnvironmentTwinModuleState extends State<DigitalEnvironmentTwinModule> {
  bool _simulationRunning = true;
  double _divergenceRate = 0.004;
  String _twinStatus = 'Digitaalinen kaksoisolio synkronoitu pääjärjestelmän kanssa (Vakaa).';

  void _runSimulationTest() {
    setState(() {
      _divergenceRate = 0.001;
      _twinStatus = 'Skenaariotesti suoritettu virtuaalikuplassa: Järjestelmäreaktio odotetun mukainen.';
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
              '🌐 AI Digital Twin & Reality Simulation',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _simulationRunning ? 'SIMULOIDAAN' : 'PYSÄYTETTY',
              style: TextStyle(color: _simulationRunning ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _twinStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                Text('Tilapoikkeama (Divergence): ${(_divergenceRate * 100).toStringAsFixed(2)}%', style: const TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                ProgressBar(value: _divergenceRate * 1000),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _runSimulationTest,
              child: const Text('Aja simulaatiotesti'),
            ),
            ToggleSwitch(
              checked: _simulationRunning,
              content: const Text('Kaksoisolion synkka', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _simulationRunning = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

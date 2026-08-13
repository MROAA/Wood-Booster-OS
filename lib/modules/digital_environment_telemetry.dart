import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentTelemetryModule extends StatefulWidget {
  const DigitalEnvironmentTelemetryModule({super.key});

  @override
  State<DigitalEnvironmentTelemetryModule> createState() => _DigitalEnvironmentTelemetryModuleState();
}

class _DigitalEnvironmentTelemetryModuleState extends State<DigitalEnvironmentTelemetryModule> {
  double _packetLoss = 0.02;
  double _bandwidth = 56.4;
  bool _telemetryActive = true;

  void _pulseTelemetry() {
    setState(() {
      _bandwidth = (45.0 + (DateTime.now().second % 35)).toDouble();
      _packetLoss = 0.01;
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
              '📡 Digital Environment Telemetry Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _telemetryActive ? 'SEURATAAN' : 'PYSÄYTETTY',
              style: TextStyle(color: _telemetryActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
                Text('Verkkokaista (Bandwidth): ${_bandwidth.toStringAsFixed(1)} KB/s', style: const TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                ProgressBar(value: _bandwidth),
                const SizedBox(height: 16),
                Text('Pakettihävikki (Packet Loss): ${_packetLoss.toStringAsFixed(2)}%', style: const TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 8),
                ProgressBar(value: _packetLoss * 100),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _pulseTelemetry,
          child: const Text('Päivitä telemetria'),
        ),
      ],
    );
  }
}

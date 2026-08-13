import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';
import 'dart:math';

class Win96MonitorModule extends StatefulWidget {
  const Win96MonitorModule({super.key});

  @override
  State<Win96MonitorModule> createState() => _Win96MonitorModuleState();
}

class _Win96MonitorModuleState extends State<Win96MonitorModule> {
  double _cpuUsage = 24.5;
  double _ramUsage = 68.2;
  double _diskUsage = 41.0;
  String _statusMessage = 'Resurssimittari aktiivinen. Seuraa järjestelmän tilaa.';

  void _refreshMetrics() {
    setState(() {
      _cpuUsage = (Random().nextDouble() * 70 + 10);
      _ramUsage = (Random().nextDouble() * 20 + 60);
      _diskUsage = (Random().nextDouble() * 5 + 40);
      _statusMessage = 'Mitattu arvo päivitetty onnistuneesti.';
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
              '📈 Win96 System Resource Meter',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _statusMessage,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
                Text('CPU Usage: ${_cpuUsage.toStringAsFixed(1)}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                ProgressBar(value: _cpuUsage),
                const SizedBox(height: 20),
                Text('RAM Usage: ${_ramUsage.toStringAsFixed(1)}% (41.2 MB / 64 MB)', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                ProgressBar(value: _ramUsage),
                const SizedBox(height: 20),
                Text('Virtual Disk C: Usage: ${_diskUsage.toStringAsFixed(1)}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                ProgressBar(value: _diskUsage),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _refreshMetrics,
          child: const Text('Päivitä mittaukset'),
        ),
      ],
    );
  }
}

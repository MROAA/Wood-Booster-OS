import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96ResmeterModule extends StatefulWidget {
  const Win96ResmeterModule({super.key});

  @override
  State<Win96ResmeterModule> createState() => _Win96ResmeterModuleState();
}

class _Win96ResmeterModuleState extends State<Win96ResmeterModule> {
  double _cpuUsage = 24.0;
  double _memUsage = 58.0;
  double _sysResources = 82.0;

  void _refreshStats() {
    setState(() {
      _cpuUsage = (15 + (DateTime.now().second % 40)).toDouble();
      _memUsage = 55.0;
      _sysResources = 80.0;
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
              '📊 Win96 System Resource Meter',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'APM 1.2 Active',
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
                const Text('Suorittimen käyttö (CPU):', style: TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 6),
                ProgressBar(value: _cpuUsage),
                const SizedBox(height: 16),
                const Text('Keskusmuistin käyttö (RAM):', style: TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 6),
                ProgressBar(value: _memUsage),
                const SizedBox(height: 16),
                const Text('Vapaat järjestelmäresurssit:', style: TextStyle(color: Colors.white, fontSize: 12)),
                const SizedBox(height: 6),
                ProgressBar(value: _sysResources),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _refreshStats,
          child: const Text('Päivitä mittaukset'),
        ),
      ],
    );
  }
}

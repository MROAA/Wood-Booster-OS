import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessTelemetryStreamModule extends StatefulWidget {
  const HeadlessTelemetryStreamModule({super.key});

  @override
  State<HeadlessTelemetryStreamModule> createState() => _HeadlessTelemetryStreamModuleState();
}

class _HeadlessTelemetryStreamModuleState extends State<HeadlessTelemetryStreamModule> {
  bool _streamActive = true;
  String _streamStats = 'Striimi aktiivinen: 1,420 tapahtumaa / sekunti välitetty.';
  final List<String> _streamLogs = [
    '[Stream] [INFO] Headless Core Daemon heartbeat OK',
    '[Stream] [DEBUG] RAG vector similarity match: 0.96 (VEC-103)',
    '[Stream] [WARN] Memory buffer usage reached 65% threshold',
    '[Stream] [INFO] Sandbox execution completed successfully',
  ];

  void _pushTestEvent() {
    setState(() {
      _streamStats = 'Striimi päivitetty: Manuaalinen telemetriatapahtuma lisätty.';
      _streamLogs.insert(0, '[Stream] [EVENT] Custom headless telemetry pulse triggered');
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
              '📊 Headless Telemetry Stream & Analytics',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _streamActive ? 'STRIIMAA' : 'PYSÄYTETTY',
              style: TextStyle(color: _streamActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Text(
            _streamStats,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _streamLogs.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _streamLogs[index],
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11, fontFamily: 'monospace'),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _pushTestEvent,
              child: const Text('Lähetä testitapahtuma'),
            ),
            ToggleSwitch(
              checked: _streamActive,
              content: const Text('Striimaus aktiivinen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _streamActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

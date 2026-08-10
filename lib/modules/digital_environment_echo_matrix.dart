import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentEchoMatrixModule extends StatefulWidget {
  const DigitalEnvironmentEchoMatrixModule({super.key});

  @override
  State<DigitalEnvironmentEchoMatrixModule> createState() => _DigitalEnvironmentEchoMatrixModuleState();
}

class _DigitalEnvironmentEchoMatrixModuleState extends State<DigitalEnvironmentEchoMatrixModule> {
  bool _echoMatrixActive = true;
  double _echoResonance = 100.0;
  String _echoStatus = 'Echo-Matrix aktiivinen: Kaikupeili ja ulottuvuuksien välinen heijastus valmiina.';
  
  final List<Map<String, String>> _echoNodes = [
    {'node': 'Omniversal Echo Core', 'tier': 'Absolute Mirror', 'status': 'Heijastaa (100%)'},
    {'node': 'Win96 Resonance Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Infinite Mirror', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseEchoMatrix() {
    setState(() {
      _echoResonance = 100.0;
      _echoStatus = 'Echo-Matrix pulssi laukaistu: Kaikuvat taajuudet resonoivat läpi koko olemassaolon.';
      _echoNodes.insert(0, {
        'node': 'Horizon-Omega Echo Matrix',
        'tier': 'Beyond Absolute',
        'status': 'Pysyvä tila'
      });
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
              '🪞 Spacemonkey Echo-Matrix & Resonance Mirror',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Kaiku: ${_echoResonance.toStringAsFixed(0)}%',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
            _echoStatus,
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
              itemCount: _echoNodes.length,
              itemBuilder: (context, index) {
                final node = _echoNodes[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(node['node']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Taso: ${node['tier']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        node['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
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
              onPressed: _pulseEchoMatrix,
              child: const Text('Aktivoi Echo-Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _echoMatrixActive,
              content: const Text('Echo-Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _echoMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

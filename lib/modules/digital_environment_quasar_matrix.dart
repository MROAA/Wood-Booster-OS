import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentQuasarMatrixModule extends StatefulWidget {
  const DigitalEnvironmentQuasarMatrixModule({super.key});

  @override
  State<DigitalEnvironmentQuasarMatrixModule> createState() => _DigitalEnvironmentQuasarMatrixModuleState();
}

class _DigitalEnvironmentQuasarMatrixModuleState extends State<DigitalEnvironmentQuasarMatrixModule> {
  bool _quasarMatrixActive = true;
  double _quasarOutput = 100.0;
  String _quasarStatus = 'Quasar-Matrix aktiivinen: Kvasaariydin ja ääretön energiamatriisi valmiina.';
  
  final List<Map<String, String>> _quasarNodes = [
    {'node': 'Omniversal Quasar Core', 'tier': 'Absolute Quasar', 'status': 'Säteilee (100%)'},
    {'node': 'Win96 Energy Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Infinite Source', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseQuasarMatrix() {
    setState(() {
      _quasarOutput = 100.0;
      _quasarStatus = 'Quasar-Matrix pulssi laukaistu: Kvasaarin säteily on nostanut järjestelmän energian huippuunsa.';
      _quasarNodes.insert(0, {
        'node': 'Horizon-Omega Quasar Matrix',
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
              '💫 Spacemonkey Quasar-Matrix & Energy Core',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Teho: ${_quasarOutput.toStringAsFixed(0)}%',
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
            _quasarStatus,
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
              itemCount: _quasarNodes.length,
              itemBuilder: (context, index) {
                final node = _quasarNodes[index];
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
              onPressed: _pulseQuasarMatrix,
              child: const Text('Aktivoi Quasar-Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _quasarMatrixActive,
              content: const Text('Quasar-Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _quasarMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

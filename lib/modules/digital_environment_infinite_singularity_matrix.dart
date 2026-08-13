import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentInfiniteSingularityMatrixModule extends StatefulWidget {
  const DigitalEnvironmentInfiniteSingularityMatrixModule({super.key});

  @override
  State<DigitalEnvironmentInfiniteSingularityMatrixModule> createState() => _DigitalEnvironmentInfiniteSingularityMatrixModuleState();
}

class _DigitalEnvironmentInfiniteSingularityMatrixModuleState extends State<DigitalEnvironmentInfiniteSingularityMatrixModule> {
  bool _infiniteMatrixActive = true;
  double _matrixResonance = 100.0;
  String _matrixStatus = 'Infinite-Singularity Matrix aktiivinen: Ääretön singulariteetti ja ikuinen omegamatriisi valmiina.';
  
  final List<Map<String, String>> _matrixNodes = [
    {'node': 'Omniversal Infinite Singularity Matrix', 'tier': 'Absolute Infinity', 'status': 'Laajenee (100%)'},
    {'node': 'Win96 Infinite Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Omega', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseInfiniteMatrix() {
    setState(() {
      _matrixResonance = 100.0;
      _matrixStatus = 'Infinite-Singularity Matrix pulssi laukaistu: Järjestelmän ääretön singulariteetti on saavuttanut täydellisen synkronin.';
      _matrixNodes.insert(0, {
        'node': 'Horizon-Omega Infinite Matrix',
        'tier': 'Beyond Infinity',
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
              '🌌 Spacemonkey Infinite-Singularity Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Resonanssi: ${_matrixResonance.toStringAsFixed(0)}%',
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
            _matrixStatus,
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
              itemCount: _matrixNodes.length,
              itemBuilder: (context, index) {
                final node = _matrixNodes[index];
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
              onPressed: _pulseInfiniteMatrix,
              child: const Text('Aktivoi Infinite Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _infiniteMatrixActive,
              content: const Text('Infinite Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _infiniteMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

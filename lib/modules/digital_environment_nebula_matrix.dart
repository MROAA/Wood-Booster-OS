import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentNebulaMatrixModule extends StatefulWidget {
  const DigitalEnvironmentNebulaMatrixModule({super.key});

  @override
  State<DigitalEnvironmentNebulaMatrixModule> createState() => _DigitalEnvironmentNebulaMatrixModuleState();
}

class _DigitalEnvironmentNebulaMatrixModuleState extends State<DigitalEnvironmentNebulaMatrixModule> {
  bool _nebulaMatrixActive = true;
  double _nebulaDensity = 100.0;
  String _nebulaStatus = 'Nebula-Matrix aktiivinen: Kosminen sumu ja kaasumatriisi valmiina.';
  
  final List<Map<String, String>> _nebulaNodes = [
    {'node': 'Omniversal Nebula Core', 'tier': 'Absolute Nebula', 'status': 'Tiivistyy (100%)'},
    {'node': 'Win96 Cosmic Dust Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Cloud', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseNebulaMatrix() {
    setState(() {
      _nebulaDensity = 100.0;
      _nebulaStatus = 'Nebula-Matrix pulssi laukaistu: Kosmisen sumun hiukkaset muovaavat uusia todellisuuksia.';
      _nebulaNodes.insert(0, {
        'node': 'Horizon-Omega Nebula Matrix',
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
              '☁️ Spacemonkey Nebula-Matrix & Cosmic Dust',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Tiheys: ${_nebulaDensity.toStringAsFixed(0)}%',
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
            _nebulaStatus,
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
              itemCount: _nebulaNodes.length,
              itemBuilder: (context, index) {
                final node = _nebulaNodes[index];
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
              onPressed: _pulseNebulaMatrix,
              child: const Text('Aktivoi Nebula-Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _nebulaMatrixActive,
              content: const Text('Nebula-Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _nebulaMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

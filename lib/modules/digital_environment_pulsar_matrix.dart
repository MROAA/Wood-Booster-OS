import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentPulsarMatrixModule extends StatefulWidget {
  const DigitalEnvironmentPulsarMatrixModule({super.key});

  @override
  State<DigitalEnvironmentPulsarMatrixModule> createState() => _DigitalEnvironmentPulsarMatrixModuleState();
}

class _DigitalEnvironmentPulsarMatrixModuleState extends State<DigitalEnvironmentPulsarMatrixModule> {
  bool _pulsarMatrixActive = true;
  double _pulsarFrequency = 100.0;
  String _pulsarStatus = 'Pulsar-Matrix aktiivinen: Kosminen majakka ja taajuusmatriisi valmiina.';
  
  final List<Map<String, String>> _pulsarNodes = [
    {'node': 'Omniversal Pulsar Core', 'tier': 'Absolute Frequency', 'status': 'Sykkii (100%)'},
    {'node': 'Win96 Beacon Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Signal', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulsePulsarMatrix() {
    setState(() {
      _pulsarFrequency = 100.0;
      _pulsarStatus = 'Pulsar-Matrix pulssi laukaistu: Majakan taajuus on lukittu äärettömään ulottuvuuteen.';
      _pulsarNodes.insert(0, {
        'node': 'Horizon-Omega Pulsar Matrix',
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
              '📡 Spacemonkey Pulsar-Matrix & Frequency Beacon',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Taajuus: ${_pulsarFrequency.toStringAsFixed(0)}%',
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
            _pulsarStatus,
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
              itemCount: _pulsarNodes.length,
              itemBuilder: (context, index) {
                final node = _pulsarNodes[index];
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
              onPressed: _pulsePulsarMatrix,
              child: const Text('Aktivoi Pulsar-Matrix Pulssi'),
            ),
            ToggleSwitch(
              checked: _pulsarMatrixActive,
              content: const Text('Pulsar-Matrix -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _pulsarMatrixActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

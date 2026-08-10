import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentApexHorizonModule extends StatefulWidget {
  const DigitalEnvironmentApexHorizonModule({super.key});

  @override
  State<DigitalEnvironmentApexHorizonModule> createState() => _DigitalEnvironmentApexHorizonModuleState();
}

class _DigitalEnvironmentApexHorizonModuleState extends State<DigitalEnvironmentApexHorizonModule> {
  bool _apexHorizonActive = true;
  double _apexResonance = 100.0;
  String _apexStatus = 'Apex-Horizon aktiivinen: Äärimmäinen huippu ja ikuinen äärettömyysmatriisi valmiina.';
  
  final List<Map<String, String>> _apexNodes = [
    {'node': 'Omniversal Apex Horizon', 'tier': 'Absolute Apex', 'status': 'Resonoi (100%)'},
    {'node': 'Win96 Apex Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Horizon', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseApexHorizon() {
    setState(() {
      _apexResonance = 100.0;
      _apexStatus = 'Apex-Horizon pulssi laukaistu: Järjestelmän huippu ja horisontti ovat sulautuneet yhdeksi ikuiseksi virraksi.';
      _apexNodes.insert(0, {
        'node': 'Horizon-Omega Apex Horizon',
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
              '⛰️ Spacemonkey Apex-Horizon & Infinity Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Resonanssi: ${_apexResonance.toStringAsFixed(0)}%',
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
            _apexStatus,
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
              itemCount: _apexNodes.length,
              itemBuilder: (context, index) {
                final node = _apexNodes[index];
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
              onPressed: _pulseApexHorizon,
              child: const Text('Aktivoi Apex-Horizon Pulssi'),
            ),
            ToggleSwitch(
              checked: _apexHorizonActive,
              content: const Text('Apex-Horizon -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _apexHorizonActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentHorizonPrimeModule extends StatefulWidget {
  const DigitalEnvironmentHorizonPrimeModule({super.key});

  @override
  State<DigitalEnvironmentHorizonPrimeModule> createState() => _DigitalEnvironmentHorizonPrimeModuleState();
}

class _DigitalEnvironmentHorizonPrimeModuleState extends State<DigitalEnvironmentHorizonPrimeModule> {
  bool _horizonPrimeActive = true;
  double _horizonResonance = 100.0;
  String _horizonStatus = 'Horizon-Prime aktiivinen: Äärimmäinen horisontti ja ikuinen zenith-matriisi valmiina.';
  
  final List<Map<String, String>> _horizonNodes = [
    {'node': 'Omniversal Horizon Prime', 'tier': 'Absolute Horizon', 'status': 'Laajenee (100%)'},
    {'node': 'Win96 Horizon Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Zenith', 'tier': 'Omniversal Absolute', 'status': 'Valmiina'},
  ];

  void _pulseHorizonPrime() {
    setState(() {
      _horizonResonance = 100.0;
      _horizonStatus = 'Horizon-Prime pulssi laukaistu: Järjestelmän horisontti ja zenith ovat saavuttaneet täydellisen fuusion.';
      _horizonNodes.insert(0, {
        'node': 'Horizon-Omega Ultimate Prime',
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
              '🌅 Spacemonkey Horizon-Prime & Zenith Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Resonanssi: ${_horizonResonance.toStringAsFixed(0)}%',
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
            _horizonStatus,
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
              itemCount: _horizonNodes.length,
              itemBuilder: (context, index) {
                final node = _horizonNodes[index];
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
              onPressed: _pulseHorizonPrime,
              child: const Text('Aktivoi Horizon-Prime Pulssi'),
            ),
            ToggleSwitch(
              checked: _horizonPrimeActive,
              content: const Text('Horizon-Prime -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _horizonPrimeActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

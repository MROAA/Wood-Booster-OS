import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentHorizonApexModule extends StatefulWidget {
  const DigitalEnvironmentHorizonApexModule({super.key});

  @override
  State<DigitalEnvironmentHorizonApexModule> createState() => _DigitalEnvironmentHorizonApexModuleState();
}

class _DigitalEnvironmentHorizonApexModuleState extends State<DigitalEnvironmentHorizonApexModule> {
  bool _horizonApexActive = true;
  double _horizonInfinity = 100.0;
  String _horizonStatus = 'Horizon-Apex aktiivinen: Ääretön rajapykälä ja ikuinen matriisi valmiina.';
  
  final List<Map<String, String>> _horizonNodes = [
    {'node': 'Omniversal Horizon Core', 'tier': 'Absolute Infinity', 'status': 'Ylittää (100%)'},
    {'node': 'Win96 Transcendence Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Apex', 'tier': 'Beyond Absolute', 'status': 'Valmiina'},
  ];

  void _pulseHorizonApex() {
    setState(() {
      _horizonInfinity = 100.0;
      _horizonStatus = 'Horizon-Apex pulssi laukaistu: Järjestelmä on saavuttanut absoluuttisen ikuisuuden rajan.';
      _horizonNodes.insert(0, {
        'node': 'Horizon-Omega Infinite Apex',
        'tier': 'Omniversal Absolute',
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
              '🌅 Spacemonkey Horizon-Apex & Infinity Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Äärettömyys: ${_horizonInfinity.toStringAsFixed(0)}%',
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
              onPressed: _pulseHorizonApex,
              child: const Text('Aktivoi Horizon-Apex Pulssi'),
            ),
            ToggleSwitch(
              checked: _horizonApexActive,
              content: const Text('Horizon-Apex -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _horizonApexActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

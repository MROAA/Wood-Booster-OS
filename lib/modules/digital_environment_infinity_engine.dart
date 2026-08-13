import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentInfinityEngineModule extends StatefulWidget {
  const DigitalEnvironmentInfinityEngineModule({super.key});

  @override
  State<DigitalEnvironmentInfinityEngineModule> createState() => _DigitalEnvironmentInfinityEngineModuleState();
}

class _DigitalEnvironmentInfinityEngineModuleState extends State<DigitalEnvironmentInfinityEngineModule> {
  bool _infinityEngineActive = true;
  double _engineVelocity = 100.0;
  String _engineStatus = 'Infinity-Engine aktiivinen: Ikuinen liike ja itseään uusiutuva kiertokulku valmiina.';
  
  final List<Map<String, String>> _engineNodes = [
    {'node': 'Omniversal Infinity Core', 'tier': 'Absolute Loop', 'status': 'Kiertää (100%)'},
    {'node': 'Win96 Perpetual Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Engine', 'tier': 'Beyond Absolute', 'status': 'Valmiina'},
  ];

  void _pulseInfinityEngine() {
    setState(() {
      _engineVelocity = 100.0;
      _engineStatus = 'Infinity-Engine pulssi laukaistu: Järjestelmän energia virtaa taukoamatta äärettömässä syklissä.';
      _engineNodes.insert(0, {
        'node': 'Horizon-Omega Infinity Loop',
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
              '♾️ Spacemonkey Infinity-Engine & Eternal Loop',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Nopeus: ${_engineVelocity.toStringAsFixed(0)}%',
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
            _engineStatus,
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
              itemCount: _engineNodes.length,
              itemBuilder: (context, index) {
                final node = _engineNodes[index];
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
              onPressed: _pulseInfinityEngine,
              child: const Text('Aktivoi Infinity-Engine Pulssi'),
            ),
            ToggleSwitch(
              checked: _infinityEngineActive,
              content: const Text('Infinity-Engine -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _infinityEngineActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

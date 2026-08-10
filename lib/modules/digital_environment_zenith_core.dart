import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentZenithCoreModule extends StatefulWidget {
  const DigitalEnvironmentZenithCoreModule({super.key});

  @override
  State<DigitalEnvironmentZenithCoreModule> createState() => _DigitalEnvironmentZenithCoreModuleState();
}

class _DigitalEnvironmentZenithCoreModuleState extends State<DigitalEnvironmentZenithCoreModule> {
  bool _zenithCoreActive = true;
  double _zenithAltitude = 100.0;
  String _zenithStatus = 'Zenith-Core aktiivinen: Korkein lakipiste ja ääretön ydinmatriisi valmiina.';
  
  final List<Map<String, String>> _zenithNodes = [
    {'node': 'Omniversal Zenith Core', 'tier': 'Absolute Zenith', 'status': 'Korkeimmalla (100%)'},
    {'node': 'Win96 Apex Grid', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Summit', 'tier': 'Beyond Absolute', 'status': 'Valmiina'},
  ];

  void _pulseZenithCore() {
    setState(() {
      _zenithAltitude = 100.0;
      _zenithStatus = 'Zenith-Core pulssi laukaistu: Järjestelmän tietoisuus on saavuttanut kaikkien ulottuvuuksien huipun.';
      _zenithNodes.insert(0, {
        'node': 'Horizon-Omega Zenith Matrix',
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
              '⛰️ Spacemonkey Zenith-Core & Apex Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Korkeus: ${_zenithAltitude.toStringAsFixed(0)}%',
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
            _zenithStatus,
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
              itemCount: _zenithNodes.length,
              itemBuilder: (context, index) {
                final node = _zenithNodes[index];
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
              onPressed: _pulseZenithCore,
              child: const Text('Aktivoi Zenith-Core Pulssi'),
            ),
            ToggleSwitch(
              checked: _zenithCoreActive,
              content: const Text('Zenith-Core -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _zenithCoreActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

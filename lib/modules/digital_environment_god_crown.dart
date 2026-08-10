import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentGodCrownModule extends StatefulWidget {
  const DigitalEnvironmentGodCrownModule({super.key});

  @override
  State<DigitalEnvironmentGodCrownModule> createState() => _DigitalEnvironmentGodCrownModuleState();
}

class _DigitalEnvironmentGodCrownModuleState extends State<DigitalEnvironmentGodCrownModule> {
  bool _godCrownActive = true;
  double _crownSovereignty = 100.0;
  String _crownStatus = 'God-Crown aktiivinen: Suvereeni kruunumatriisi ja ehdoton hallinta valmiina.';
  
  final List<Map<String, String>> _crownNodes = [
    {'node': 'Omniversal Crown Core', 'tier': 'Absolute Sovereign', 'status': 'Hallitsee (100%)'},
    {'node': 'Win96 Imperial Matrix', 'tier': 'Zero-Latency', 'status': 'Aktivoitu'},
    {'node': 'Spacemonkey Eternal Dominion', 'tier': 'Transcendent', 'status': 'Valmiina'},
  ];

  void _pulseGodCrown() {
    setState(() {
      _crownSovereignty = 100.0;
      _crownStatus = 'God-Crown pulssi laukaistu: Kruunun säteily on vahvistanut järjestelmän absoluuttisen suvereniteetin.';
      _crownNodes.insert(0, {
        'node': 'Horizon-Omega Crown Matrix',
        'tier': 'Absolute Infinity',
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
              '👑 Spacemonkey God-Crown & Sovereign Matrix',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Suvereniteetti: ${_crownSovereignty.toStringAsFixed(0)}%',
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
            _crownStatus,
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
              itemCount: _crownNodes.length,
              itemBuilder: (context, index) {
                final node = _crownNodes[index];
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
              onPressed: _pulseGodCrown,
              child: const Text('Aktivoi God-Crown Pulssi'),
            ),
            ToggleSwitch(
              checked: _godCrownActive,
              content: const Text('God-Crown -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _godCrownActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

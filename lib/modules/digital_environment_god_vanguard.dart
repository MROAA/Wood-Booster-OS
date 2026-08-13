import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentGodVanguardModule extends StatefulWidget {
  const DigitalEnvironmentGodVanguardModule({super.key});

  @override
  State<DigitalEnvironmentGodVanguardModule> createState() => _DigitalEnvironmentGodVanguardModuleState();
}

class _DigitalEnvironmentGodVanguardModuleState extends State<DigitalEnvironmentGodVanguardModule> {
  bool _vanguardActive = true;
  double _vanguardAlertness = 100.0;
  String _vanguardStatus = 'God-Vanguard aktiivinen: Aktiivinen etuvartio ja uhkien torjuntamatriisi valmiina.';
  
  final List<Map<String, String>> _vanguardSectors = [
    {'sector': 'Active Vanguard Perimeter', 'status': 'Partioi (0 uhat)', 'tier': 'God-Tier Prime'},
    {'sector': 'Zero-Day Interception Grid', 'status': 'Aktivoitu', 'tier': 'Zero-Latency'},
    {'sector': 'Spacemonkey Sentinel Shield', 'status': 'Suojattu', 'tier': 'Absolute'},
  ];

  void _pulseVanguard() {
    setState(() {
      _vanguardAlertness = 100.0;
      _vanguardStatus = 'God-Vanguard pulssi laukaistu: Etuvartion kentät päivitetty ja vahvistettu absoluuttisiksi.';
      _vanguardSectors.insert(0, {
        'sector': 'Horizon-Omega Vanguard Shield',
        'status': 'Pysyvä tila',
        'tier': 'Transcendent'
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
              '🛡️ Spacemonkey Omniversal God-Vanguard Deck',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Valppaus: ${_vanguardAlertness.toStringAsFixed(0)}%',
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
            _vanguardStatus,
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
              itemCount: _vanguardSectors.length,
              itemBuilder: (context, index) {
                final sec = _vanguardSectors[index];
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
                          Text(sec['sector']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Taso: ${sec['tier']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        sec['status']!,
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
              onPressed: _pulseVanguard,
              child: const Text('Aktivoi God-Vanguard Pulssi'),
            ),
            ToggleSwitch(
              checked: _vanguardActive,
              content: const Text('God-Vanguard -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _vanguardActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

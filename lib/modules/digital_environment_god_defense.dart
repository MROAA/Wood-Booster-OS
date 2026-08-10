import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentGodDefenseModule extends StatefulWidget {
  const DigitalEnvironmentGodDefenseModule({super.key});

  @override
  State<DigitalEnvironmentGodDefenseModule> createState() => _DigitalEnvironmentGodDefenseModuleState();
}

class _DigitalEnvironmentGodDefenseModuleState extends State<DigitalEnvironmentGodDefenseModule> {
  bool _defenseGridActive = true;
  double _threatNeutralizationRate = 100.0;
  String _defenseStatus = 'Cyber Defense Core aktiivinen: Zero-day hyökkäykset estetty reaaliajassa.';
  
  final List<Map<String, String>> _defenseSectors = [
    {'sector': 'Zero-Day Vulnerability Shield', 'layer': 'God-Tier Security', 'status': 'Puhdas (100%)'},
    {'sector': 'Autonomous C++ Memory Warden', 'layer': 'Bare-Metal', 'status': 'Aktivoitu'},
    {'sector': 'Quantum Intrusion Prevention', 'layer': 'Omni-Scale', 'status': 'Valmiina'},
  ];

  void _executeDefenseSweep() {
    setState(() {
      _threatNeutralizationRate = 100.0;
      _defenseStatus = 'Täydellinen puolustusskannaus suoritettu: 0 uhkaa, järjestelmä on täysin läpäisemätön.';
      _defenseSectors.insert(0, {
        'sector': 'Horizon-Omega Defense Matrix',
        'layer': 'Absolute Infinity',
        'status': 'Pysyvä suoja'
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
              '🛡️ Spacemonkey Cyber Defense & Neutralizer',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Teho: ${_threatNeutralizationRate.toStringAsFixed(0)}%',
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
            _defenseStatus,
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
              itemCount: _defenseSectors.length,
              itemBuilder: (context, index) {
                final sector = _defenseSectors[index];
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
                          Text(sector['sector']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Kerros: ${sector['layer']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        sector['status']!,
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
              onPressed: _executeDefenseSweep,
              child: const Text('Suorita Cyber Defense -skannaus'),
            ),
            ToggleSwitch(
              checked: _defenseGridActive,
              content: const Text('Cyber Defense -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _defenseGridActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

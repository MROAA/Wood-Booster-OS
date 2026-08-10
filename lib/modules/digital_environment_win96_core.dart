import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentWin96CoreModule extends StatefulWidget {
  const DigitalEnvironmentWin96CoreModule({super.key});

  @override
  State<DigitalEnvironmentWin96CoreModule> createState() => _DigitalEnvironmentWin96CoreModuleState();
}

class _DigitalEnvironmentWin96CoreModuleState extends State<DigitalEnvironmentWin96CoreModule> {
  bool _win96MasterActive = true;
  double _systemCoherence = 100.0;
  String _coreStatus = 'Win96 Digitaalinen Ympäristö: Kaikki yli 80 jumal-moduulia ja C/C++ ydin synkronoitu.';
  
  final List<Map<String, String>> _activeSubsystems = [
    {'subsystem': 'Spacemonkey Omniversal Core', 'status': 'Aktiivinen (100%)', 'type': 'God-Throne'},
    {'subsystem': 'Autonomous C++ JIT Engine', 'status': 'Zero-Latency', 'type': 'Bare-Metal'},
    {'subsystem': 'Quantum Sanctuary & Citadel', 'status': 'Suojattu', 'type': 'Security'},
    {'subsystem': 'Zero-Copy Memory Arena Pool', 'status': 'Optimoitu O3', 'type': 'Memory'},
  ];

  void _executeMasterSync() {
    setState(() {
      _systemCoherence = 100.0;
      _coreStatus = 'Win96 Pääsynkronointi suoritettu: Koko digitaalinen ympäristö toimii täydellisessä harmoniassa.';
      _activeSubsystems.insert(0, {
        'subsystem': 'Win96 Horizon-Omega Matrix',
        'status': 'Pysyvä Absoluuttinen',
        'type': 'Core'
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
              '🪟 Win96 Digital Environment Master Core',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Koherenssi: ${_systemCoherence.toStringAsFixed(0)}%',
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
            _coreStatus,
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
              itemCount: _activeSubsystems.length,
              itemBuilder: (context, index) {
                final sys = _activeSubsystems[index];
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
                          Text(sys['subsystem']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Tyyppi: ${sys['type']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        sys['status']!,
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
              onPressed: _executeMasterSync,
              child: const Text('Suorita Win96 Pääsynkronointi'),
            ),
            ToggleSwitch(
              checked: _win96MasterActive,
              content: const Text('Win96 Master -tila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _win96MasterActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96PowerModule extends StatefulWidget {
  const Win96PowerModule({super.key});

  @override
  State<Win96PowerModule> createState() => _Win96PowerModuleState();
}

class _Win96PowerModuleState extends State<Win96PowerModule> {
  String _powerScheme = 'Always On (Desktop Optimized)';
  bool _apmEnabled = true;

  void _setScheme(String scheme) {
    setState(() {
      _powerScheme = scheme;
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
              '⚡ Win96 Power Management & APM',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _powerScheme,
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Virranhallintaprofiili:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Button(
                      onPressed: () => _setScheme('Always On (Desktop Optimized)'),
                      child: const Text('Always On'),
                    ),
                    Button(
                      onPressed: () => _setScheme('Energy Saver (Laptop)'),
                      child: const Text('Energy Saver'),
                    ),
                    Button(
                      onPressed: () => _setScheme('Maximum Performance'),
                      child: const Text('Max Performance'),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Advanced Power Management (APM 1.2)', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ToggleSwitch(
                      checked: _apmEnabled,
                      onChanged: (val) {
                        setState(() {
                          _apmEnabled = val;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

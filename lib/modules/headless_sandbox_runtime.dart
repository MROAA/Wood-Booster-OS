import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessSandboxRuntimeModule extends StatefulWidget {
  const HeadlessSandboxRuntimeModule({super.key});

  @override
  State<HeadlessSandboxRuntimeModule> createState() => _HeadlessSandboxRuntimeModuleState();
}

class _HeadlessSandboxRuntimeModuleState extends State<HeadlessSandboxRuntimeModule> {
  bool _sandboxActive = true;
  String _sandboxStatus = 'Sandbox-ympäristö valmiina: Eristetty mikro-VM / prosessiavaruus aktiivinen.';
  final List<String> _sandboxLogs = [
    '[Sandbox] Eristetty tiedostojärjestelmä pystytetty (/workspace).',
    '[Sandbox] Verkkoliikenne ohjattu turvaproksin läpi.',
    '[Sandbox] Resurssirajat asetettu: Max muisti 512MB, CPU 25%.',
  ];

  void _executeInSandbox() {
    setState(() {
      _sandboxStatus = 'Koodisuoritus suoritettu hiekkalaatikossa onnistuneesti (Exit code: 0).';
      _sandboxLogs.insert(0, '[Sandbox] Suoritettu dynaaminen agenttikomento eristetyssä tilassa.');
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
              '🛡️ Headless Sandbox & Isolated Agent Runtime',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _sandboxActive ? 'ERISTETTY' : 'PYSÄYTETTY',
              style: TextStyle(color: _sandboxActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _sandboxStatus,
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
              itemCount: _sandboxLogs.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _sandboxLogs[index],
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11, fontFamily: 'monospace'),
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
              onPressed: _executeInSandbox,
              child: const Text('Suorita koodi sandboxissa'),
            ),
            ToggleSwitch(
              checked: _sandboxActive,
              content: const Text('Sandbox-suojaus', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _sandboxActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

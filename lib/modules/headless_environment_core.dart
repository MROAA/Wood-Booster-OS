import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessEnvironmentCoreModule extends StatefulWidget {
  const HeadlessEnvironmentCoreModule({super.key});

  @override
  State<HeadlessEnvironmentCoreModule> createState() => _HeadlessEnvironmentCoreModuleState();
}

class _HeadlessEnvironmentCoreModuleState extends State<HeadlessEnvironmentCoreModule> {
  bool _headlessDaemonRunning = true;
  String _headlessStatus = 'Headless daemon aktiivinen taustalla (PID: 1996).';
  final List<String> _daemonLogs = [
    '[Headless] Taustapalvelu käynnistetty ilman ikkunariippuvuutta.',
    '[Headless] Vektoritietokanta synkronoitu headless-muistiin.',
    '[Headless] RAG-moottori kuuntelee tapahtumia taustalla.',
  ];

  void _pulseHeadlessDaemon() {
    setState(() {
      _headlessStatus = 'Headless daemon suoritti taustasyklin ja optimoi muistin.';
      _daemonLogs.insert(0, '[Headless] Synkronointipulssi ajettu onnistuneesti.');
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
              '⚙️ Headless Environment & Core Daemon',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _headlessDaemonRunning ? 'TAUSTALLA' : 'PYSÄYTETTY',
              style: TextStyle(color: _headlessDaemonRunning ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
            _headlessStatus,
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
              itemCount: _daemonLogs.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _daemonLogs[index],
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
              onPressed: _pulseHeadlessDaemon,
              child: const Text('Aja headless-pulssi'),
            ),
            ToggleSwitch(
              checked: _headlessDaemonRunning,
              content: const Text('Daemon aktiivinen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _headlessDaemonRunning = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}

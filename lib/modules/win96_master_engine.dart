import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class Win96MasterEngine extends StatefulWidget {
  const Win96MasterEngine({super.key});

  @override
  State<Win96MasterEngine> createState() => _Win96MasterEngineState();
}

class _Win96MasterEngineState extends State<Win96MasterEngine> {
  String _kernelStatus = 'KERNEL_READY [Build 2296.wood_booster]';
  bool _isBooting = false;
  double _bootProgress = 100.0;

  void _rebootKernel() {
    setState(() {
      _isBooting = true;
      _kernelStatus = 'Käynnistetään uudelleen... (BIOS POST)';
      _bootProgress = 0.0;
    });

    // Simulaatio käynnistyssekvenssistä
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _bootProgress = 50.0;
          _kernelStatus = 'Ladataan ajureita: win96_engine, task_mgr, network...';
        });
      }
    });

    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _bootProgress = 100.0;
          _isBooting = false;
          _kernelStatus = 'KERNEL_ONLINE: Kaikki 10 moduulia linkitetty onnistuneesti.';
        });
      }
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
              '⚡ Win96 Master Kernel Engine',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Status: ${_isBooting ? "BOOTING..." : "ONLINE"}',
              style: TextStyle(color: _isBooting ? Colors.orange : Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _kernelStatus,
                style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 12, fontFamily: 'monospace'),
              ),
              const SizedBox(height: 12),
              ProgressBar(value: _bootProgress),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Järjestelmän alijärjestelmät & linkit:',
          style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView(
              children: const [
                Text('• win96_module.dart (DOS Shell & Matrix)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_desktop_widgets.dart (System Properties & Media)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_engine.dart (Registry & Sound Synth)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_task_manager.dart (Process Monitor)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_explorer.dart (File System & Control Panel)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_notepad.dart (Text Processor)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_calculator.dart (FPU Benchmark)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_network.dart (TCP/IP & Ping)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_pinball.dart (Space Cadet Entertainment)', style: TextStyle(color: Colors.white, fontSize: 11)),
                Text('• win96_devices.dart (Hardware Device Manager)', style: TextStyle(color: Colors.white, fontSize: 11)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _isBooting ? null : _rebootKernel,
          child: const Text('Käynnistä Kernel uudelleen (Soft Reset)'),
        ),
      ],
    );
  }
}

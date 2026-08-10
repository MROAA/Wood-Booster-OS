import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';
import 'dart:math';

class Win96ScreensaverModule extends StatefulWidget {
  const Win96ScreensaverModule({super.key});

  @override
  State<Win96ScreensaverModule> createState() => _Win96ScreensaverModuleState();
}

class _Win96ScreensaverModuleState extends State<Win96ScreensaverModule> {
  String _activeSaver = '3D Pipes (OpenGL v1.0)';
  int _pipeCount = 12;
  bool _isRunning = true;

  void _triggerSaver(String name) {
    setState(() {
      _activeSaver = name;
      _pipeCount = Random().nextInt(20) + 5;
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
              '🌌 Win96 Retro Screensaver Engine (ss pipes.scr)',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _isRunning ? 'Aktiivinen' : 'Pysäytetty',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.2)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(FluentIcons.ict_logo, size: 48, color: Colors.blue),
                const SizedBox(height: 16),
                Text(
                  'Näytönsäästäjä: $_activeSaver',
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 13, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Renderöidään aktiivisia putkielementtejä: $_pipeCount kpl',
                  style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(onPressed: () => _triggerSaver('3D Pipes'), child: const Text('3D Pipes')),
            Button(onPressed: () => _triggerSaver('Flying Windows 96'), child: const Text('Flying Windows')),
            Button(onPressed: () => _triggerSaver('Starfield Simulation'), child: const Text('Starfield')),
          ],
        ),
      ],
    );
  }
}

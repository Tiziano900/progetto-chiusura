import { Resoconto } from '../domain/Resoconto';

export default class ResocontoService {
  constructor(resocontoRepository) {
    this.resocontoRepository = resocontoRepository;
  }

  chiudiTurno(id) {
    return this.resocontoRepository.chiudiTurno(id);
  }
} 
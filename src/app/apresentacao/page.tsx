import type { Metadata } from 'next'
import '../page.css'
import './apresentacao.css'
import Slideshow from './Slideshow'

export const metadata: Metadata = {
  title: 'Locadora — Apresentação',
  description: 'Conheça o painel de gestão de locação por dentro: financeiro, repasse automático ao proprietário, portal do inquilino e mais.',
}

export default function ApresentacaoPage() {
  return <Slideshow />
}

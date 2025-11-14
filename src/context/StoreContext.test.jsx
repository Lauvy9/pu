import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { StoreProvider, useStore } from './StoreContext'

function TestComp(){
  const { sales, fiados, actions } = useStore()
  return (
    <div>
      <div data-testid="sales-count">{sales.length}</div>
      <div data-testid="fiados-count">{fiados.length}</div>
      <button onClick={() => actions.registerPayment({ relatedId: 'sale_test', type: 'sale', metodo: 'efectivo', amount: 100 })}>pay1</button>
      <button onClick={() => actions.registerPayment({ relatedId: 'sale_test', type: 'sale', metodo: 'efectivo', amount: 100 })}>pay2</button>
      <div data-testid="sale-paid">{(sales.find(s=>s.id==='sale_test')||{}).pagado ? 'true' : 'false'}</div>
      <div data-testid="fiado-deuda">{(fiados.find(f=>f.id===1)||{}).deuda}</div>
    </div>
  )
}

describe('StoreContext registerPayment', () => {
  beforeEach(() => {
    // seed localStorage used by useLocalStorage hook
    localStorage.setItem('vid_sales', JSON.stringify([{ id: 'sale_test', total: 200, items: [], type: 'fiado', clienteFiado: 1 }]));
    localStorage.setItem('vid_fiados', JSON.stringify([{ id: 1, nombre: 'Cliente A', deuda: 200, movimientos: [{ id: 'entry1', amount: 200, payments: [], saleId: 'sale_test', active: true }] }]));
    localStorage.removeItem('vid_payments')
  })

  it('records partial and total payments and syncs with fiados', async () => {
    render(
      <StoreProvider>
        <TestComp />
      </StoreProvider>
    )

    const btn1 = screen.getByText('pay1')
    const btn2 = screen.getByText('pay2')

    fireEvent.click(btn1)
    // after first payment, sale should not be pagado
    const paidDisplay1 = await screen.findByTestId('sale-paid')
    expect(paidDisplay1.textContent).toBe('false')

    fireEvent.click(btn2)
    const paidDisplay2 = await screen.findByTestId('sale-paid')
    expect(paidDisplay2.textContent).toBe('true')

    // fiado deuda should be updated (0)
    const deuda = await screen.findByTestId('fiado-deuda')
    expect(Number(deuda.textContent)).toBe(0)
  })
})

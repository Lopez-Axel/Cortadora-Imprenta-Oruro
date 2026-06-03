"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LayoutResult } from "@/lib/models/types"

type StrategyComparisonProps = {
  results: LayoutResult[]
  totalRequested: number
  bestResult: LayoutResult | null
}

export function StrategyComparison({
  results,
  totalRequested,
  bestResult,
}: StrategyComparisonProps) {
  if (results.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Comparación de Estrategias</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estrategia</TableHead>
              <TableHead className="text-right">Piezas</TableHead>
              <TableHead className="text-right">Aprovechamiento</TableHead>
              <TableHead className="text-right">Desperdicio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => {
              const isBest = bestResult !== null && r.strategy === bestResult.strategy
              return (
                <TableRow
                  key={r.strategy}
                  className={isBest ? "bg-primary/10 font-medium" : undefined}
                >
                  <TableCell>
                    {r.strategy}
                    {isBest && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Mejor opción
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.totalPiecesPlaced}/{totalRequested}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.efficiency.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {r.wasteArea.toFixed(0)} mm²
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

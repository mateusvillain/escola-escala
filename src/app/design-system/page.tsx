'use client'
import { Alert, Badge, Button, Card, Input } from '@/components/ui'

export default function DesignSystemPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <lui-heading level="1" style={{ marginBottom: '2rem', display: 'block' }}>
        Design System — Let&apos;s UI
      </lui-heading>

      {/* Buttons */}
      <section style={{ marginBottom: '2rem' }}>
        <lui-heading level="2" style={{ marginBottom: '1rem', display: 'block' }}>
          Buttons
        </lui-heading>
        <lui-stack space="sm">
          <lui-flex gap="sm" wrap="wrap">
            <Button label="Primary" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Ghost" variant="ghost" />
            <Button label="Danger" variant="danger" />
          </lui-flex>
          <lui-flex gap="sm" wrap="wrap">
            <Button label="Large" size="lg" />
            <Button label="Medium" size="md" />
            <Button label="Disabled" disabled />
            <Button label="Loading" loading loadingText="Carregando..." />
          </lui-flex>
        </lui-stack>
      </section>

      <lui-divider style={{ marginBottom: '2rem' }} />

      {/* Inputs */}
      <section style={{ marginBottom: '2rem' }}>
        <lui-heading level="2" style={{ marginBottom: '1rem', display: 'block' }}>
          Inputs
        </lui-heading>
        <lui-stack space="md">
          <Input label="Nome completo" placeholder="Digite seu nome" />
          <Input label="E-mail" type="email" placeholder="email@exemplo.com" required hint="Usaremos para enviar o acesso" />
          <Input label="Senha" type="password" placeholder="••••••••" required />
          <Input label="Campo com erro" error errorText="Este campo é obrigatório" value="valor inválido" />
          <Input label="Desabilitado" disabled value="Não editável" />
        </lui-stack>
      </section>

      <lui-divider style={{ marginBottom: '2rem' }} />

      {/* Badges */}
      <section style={{ marginBottom: '2rem' }}>
        <lui-heading level="2" style={{ marginBottom: '1rem', display: 'block' }}>
          Badges
        </lui-heading>
        <lui-flex gap="sm" wrap="wrap">
          <Badge label="Primary" variant="primary" />
          <Badge label="Success" variant="success" />
          <Badge label="Danger" variant="danger" />
          <Badge label="Caution" variant="caution" />
          <Badge label="Info" variant="info" />
          <Badge label="Secondary" variant="secondary" />
        </lui-flex>
        <lui-flex gap="sm" wrap="wrap" style={{ marginTop: '0.5rem' }}>
          <Badge label="Surface" tagStyle="surface" variant="primary" />
          <Badge label="Subtle" tagStyle="subtle" variant="primary" />
          <Badge label="Outline" tagStyle="outline" variant="primary" />
        </lui-flex>
      </section>

      <lui-divider style={{ marginBottom: '2rem' }} />

      {/* Alerts */}
      <section style={{ marginBottom: '2rem' }}>
        <lui-heading level="2" style={{ marginBottom: '1rem', display: 'block' }}>
          Alerts
        </lui-heading>
        <lui-stack space="sm">
          <Alert variant="success" title="Sucesso!" content="Sua operação foi realizada com sucesso." />
          <Alert variant="info" title="Informação" content="Aqui vai uma mensagem informativa para o usuário." />
          <Alert variant="caution" title="Atenção" content="Verifique os dados antes de continuar." />
          <Alert variant="danger" title="Erro" content="Ocorreu um erro. Por favor, tente novamente." />
        </lui-stack>
      </section>

      <lui-divider style={{ marginBottom: '2rem' }} />

      {/* Cards */}
      <section style={{ marginBottom: '2rem' }}>
        <lui-heading level="2" style={{ marginBottom: '1rem', display: 'block' }}>
          Cards
        </lui-heading>
        <lui-grid columns="2" gap="md">
          <lui-grid-item>
            <Card ariaLabel="Card de exemplo">
              <div slot="header">
                <lui-heading level="3">Título do card</lui-heading>
              </div>
              <div slot="body">
                <lui-body>Conteúdo descritivo do card com informações relevantes para o usuário.</lui-body>
              </div>
              <div slot="actions">
                <Button label="Ação" size="md" />
              </div>
            </Card>
          </lui-grid-item>
          <lui-grid-item>
            <Card ariaLabel="Card com badge">
              <div slot="header">
                <lui-flex align="center" justify="space-between">
                  <lui-heading level="3">Card com status</lui-heading>
                  <Badge label="Ativo" variant="success" />
                </lui-flex>
              </div>
              <div slot="body">
                <lui-body>Este card demonstra a combinação de componentes base.</lui-body>
              </div>
            </Card>
          </lui-grid-item>
        </lui-grid>
      </section>

      <lui-divider style={{ marginBottom: '2rem' }} />

      {/* Color tokens */}
      <section style={{ marginBottom: '2rem' }}>
        <lui-heading level="2" style={{ marginBottom: '1rem', display: 'block' }}>
          Tokens de Cor
        </lui-heading>
        <lui-flex gap="sm" wrap="wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--lui-border-radius-md)',
                background: `var(--lui-brand-color-primary-${n})`,
                border: '1px solid var(--lui-brand-color-secondary-3)',
              }}
              title={`primary-${n}`}
            />
          ))}
        </lui-flex>
      </section>
    </main>
  )
}

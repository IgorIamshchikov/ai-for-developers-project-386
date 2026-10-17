class CreateEventTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :event_types, id: :uuid do |t|
      t.string :title, null: false
      t.text :description, null: false
      t.integer :duration_minutes, null: false

      t.timestamps
    end
  end
end

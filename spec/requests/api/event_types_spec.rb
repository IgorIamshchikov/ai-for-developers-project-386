# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::EventTypes", type: :request do
  describe "POST /api/event-types" do
    describe "когда данные валидны" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "Знакомство",
          description: "Короткий звонок на 15 минут",
          durationMinutes: 15
        }
      end

      it "возвращает 201" do
        expect(response).to have_http_status(:created)
      end

      it "соответствует контракту" do
        assert_api_conform(status: 201)
      end

      it "возвращает созданный ресурс" do
        expect(response.parsed_body).to include(
          "title" => "Знакомство",
          "description" => "Короткий звонок на 15 минут",
          "durationMinutes" => 15
        )
      end

      it "генерирует id в виде uuid" do
        expect(response.parsed_body["id"]).to match(/\A[0-9a-f-]{36}\z/)
      end
    end

    describe "когда title пустой" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "",
          description: "Короткий звонок",
          durationMinutes: 15
        }
      end

      it "возвращает 422" do
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки validation" do
        expect(response.parsed_body["error"]["code"]).to eq("validation")
      end
    end

    describe "когда description пустой" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "Знакомство",
          description: "",
          durationMinutes: 15
        }
      end

      it "возвращает 422" do
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки validation" do
        expect(response.parsed_body["error"]["code"]).to eq("validation")
      end
    end

    describe "когда durationMinutes меньше 1" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "Знакомство",
          description: "Короткий звонок",
          durationMinutes: 0
        }
      end

      it "возвращает 422" do
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки validation" do
        expect(response.parsed_body["error"]["code"]).to eq("validation")
      end
    end
  end

  describe "GET /api/event-types" do
    before do
      EventType.create!(title: "Эфир", description: "Описание", duration_minutes: 30)
      EventType.create!(title: "Знакомство", description: "Описание", duration_minutes: 15)

      get "/api/event-types"
    end

    it "возвращает 200" do
      expect(response).to have_http_status(:ok)
    end

    it "соответствует контракту" do
      assert_api_conform(status: 200)
    end

    it "возвращает типы событий по алфавиту title" do
      expect(response.parsed_body.pluck("title")).to eq(%w[Знакомство Эфир])
    end
  end
end
